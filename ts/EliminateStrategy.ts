import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { EliminateAction } from "./EliminateAction";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { groupBy } from "./groupBy";
import { addImpossibleAddedEffectsFromTurn } from "./ImpossibleAdded";
import { InspectorType } from "./InspectorType";
import { minus, plus } from "./minus";
import { MysteryCard } from "./MysteryCard";
import { objectMap } from "./objectMap";
import { availableValuesByType } from "./playedEvidence";
import { Comparator, CompareResult, reduceOptions } from "./reduceOptions";
import { summingPathsTo } from "./summingPathsTo";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unfinishedLeads";
import { HasVisibleBoard, VisibleLead } from "./VisibleBoard";

export interface EliminateOption extends BotTurnOption {
	action: EliminateAction;
	strategyType: BotTurnStrategyType.Eliminate;
}

export function buildEliminateEffects(
	mysteryCard: MysteryCard,
	unconfirmedLeads: VisibleLead[],
	otherPlayerEvidence: EvidenceCard[],
	turn: HasVisibleBoard,
	inspector: InspectorType | undefined,
	availableByType: Record<EvidenceType, number[]>,
	visibleValues: EvidenceValue[],
): BotTurnEffectType[] {
	const effects: BotTurnEffectType[] = [];
	const investigationMarker = turn.board.investigationMarker;
	const investigationGap = INVESTIGATION_MARKER_GOAL - investigationMarker;
	const markerMultiplier = inspector === InspectorType.Gregson ? 2 : 1;
	const evidenceCards = mysteryCard.asArray();
	addImpossibleAddedEffectsFromTurn(effects, turn, CardType.Evidence, BotTurnStrategyType.Eliminate, inspector);
	const gapsByType = objectMap(groupBy(unconfirmedLeads, l => l.leadCard.evidenceType), leads => leads.map(l => l.leadCard.evidenceTarget + l.badValue - l.evidenceValue));
	for (const evidenceCard of evidenceCards) {
		effects.push(BotTurnEffectType.EliminatePossibility);
		const { evidenceValue, evidenceType } = evidenceCard;
		const markerDelta = evidenceValue * markerMultiplier;
		const remain = investigationGap - markerDelta;
		if (remain < 0) {
			effects.push(BotTurnEffectType.EliminateMightLose);
		}
		const gaps = gapsByType[evidenceType] || [];
		const availableWith = plus(availableByType[evidenceType] || [], evidenceValue);
		const availableWithout = minus(availableByType[evidenceType] || [], evidenceValue);
		const useForLeads = gaps.map(gap => {
			const solvableWithoutThisCard = summingPathsTo(gap, availableWithout) > 0;
			const solvableWithThisCard = summingPathsTo(gap, availableWith) > 0;
			return { solvableWithThisCard, solvableWithoutThisCard };
		});
		const visiblePathsToRemain = remain === 0 ? 1 : summingPathsTo(remain, visibleValues);
		const wedgesInvestigation = (remain > 0) && (visiblePathsToRemain === 0);
		if (wedgesInvestigation) {
			effects.push(BotTurnEffectType.EliminateWedgesInvestigation);
		}
		if (useForLeads.find(u => !u.solvableWithoutThisCard && u.solvableWithThisCard) != null) {
			effects.push(BotTurnEffectType.EliminateWedgesLead);
		} else if (useForLeads.find(u => u.solvableWithThisCard) != null) {
			if (remain === 0) {
				effects.push(BotTurnEffectType.EliminateMaybeUsefulCompletesInvestigation);
			} else if (visiblePathsToRemain > 0) {
				effects.push(BotTurnEffectType.EliminateMaybeUsefulSetsUpExact);
			} else {
				effects.push(BotTurnEffectType.EliminateMaybeUseful);
			}
		} else {
			if (remain === 0) {
				effects.push(BotTurnEffectType.EliminateUnusedCompletesInvestigation);
			} else if (visiblePathsToRemain > 0) {
				effects.push(BotTurnEffectType.EliminateUnusedSetsUpExact);
			} else {
				effects.push(BotTurnEffectType.EliminateUnused);
			}
		}
	}
	return effects;
}

/*
export function buildEliminateEffects(
	mysteryCard: MysteryCard,
	unconfirmedEvidenceTypes: EvidenceType[],
	otherPlayerEvidence: EvidenceCard[],
	turn: HasVisibleBoard,
	inspector: InspectorType | undefined,
	stompsExact: boolean,
): BotTurnEffectType[] {
	const effects: BotTurnEffectType[] = [];
	const investigationMarker = turn.board.investigationMarker;
	const investigationGap = INVESTIGATION_MARKER_GOAL - investigationMarker;
	const { possibleTypes, possibleValues } = mysteryCard;
	const evidenceValue: EvidenceValue | undefined = possibleValues.length === 1 ? possibleValues[0] : undefined;
	const evidenceType: EvidenceType | undefined = possibleTypes.length === 1 ? possibleTypes[0] : undefined;
	const markerMultiplier = inspector === InspectorType.Gregson ? 2 : 1;
	const maybeUsed = unconfirmedEvidenceTypes.findIndex(et => mysteryCard.couldBeType(et)) >= 0;
	const markerDelta = evidenceValue == null ? undefined : (evidenceValue * markerMultiplier);
	if (evidenceType == null && evidenceValue == null) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateWild);
	} else if (evidenceValue != null && markerDelta != null) {
		if (markerDelta > investigationGap) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
		} else {
			if (markerDelta === investigationGap) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigationComplete);
			} else if (otherPlayerEvidence.find(e => !unconfirmedEvidenceTypes.includes(e.evidenceType) && (e.evidenceValue + evidenceValue === investigationGap)) != null) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateSetsUpExact);
			}
			if (maybeUsed) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateKnownValueUsedType);
			} else {
				addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateKnownValueUnusedType);
			}
		}
	} else {  // known type, unknown value
		if (maybeUsed) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateUnknownValueUsedType);
		} else {
			addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateUnknownValueUnusedType);
		}
	}
	const couldCauseLoss = possibleValues.filter(v => (v * markerMultiplier) > investigationGap).length;
	if (couldCauseLoss === possibleValues.length) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
	} else if (couldCauseLoss > 0) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.MaybeLose);
	}
	if (stompsExact && markerDelta !== investigationGap) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateStompsExact);
	}
	addImpossibleAddedEffectsFromTurn(effects, turn, CardType.Evidence, BotTurnStrategyType.Eliminate, inspector);
	return effects;
}
*/

export function buildEliminateOption(
	effects: BotTurnEffectType[],
	handIndex: number,
): EliminateOption {
	return {
		action: {
			actionType: ActionType.Eliminate,
			handIndex,
		},
		effects,
		strategyType: BotTurnStrategyType.Eliminate,
	};
}

function compareWithHand(hand: MysteryCard[]): Comparator<EliminateAction> {
	return (firstAction, secondAction): CompareResult => {
		// in general, we want to eliminate higher-valued cards
		return hand[secondAction.handIndex].averageValue() > hand[firstAction.handIndex].averageValue() ? CompareResult.Second : CompareResult.First;
	};
}

export class EliminateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Eliminate;

	public buildOptions(turn: TurnStart, bot: Bot): EliminateOption[] {
		const availableByType = availableValuesByType(turn);
		const unconfirmed = unfinishedLeads(turn);
		const otherPlayerEvidence = turn.otherPlayers.flatMap(op => op.hand);
		const visibleValues = turn.otherPlayers.flatMap(op => op.hand.map(c => (op.inspector === InspectorType.Gregson ? 2 : 1) * c.evidenceValue));
		const options = bot.hand
			.map(mysteryCard => buildEliminateEffects(mysteryCard, unconfirmed, otherPlayerEvidence, turn, bot.inspector, availableByType, visibleValues))
			.map((effects, handIndex) => buildEliminateOption(effects, handIndex));
		return reduceOptions(options, compareWithHand(bot.hand));
	}
}
