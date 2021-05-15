import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import { mean } from "./arrayMath";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { EliminateAction } from "./EliminateAction";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { addImpossibleAddedEffectsFromTurn } from "./ImpossibleAdded";
import { InspectorType } from "./InspectorType";
import { MysteryCard } from "./MysteryCard";
import { Comparator, CompareResult, reduceOptions } from "./reduceOptions";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unfinishedLeads";
import { HasVisibleBoard } from "./VisibleBoard";

export interface EliminateOption extends BotTurnOption {
	action: EliminateAction;
	strategyType: BotTurnStrategyType.Eliminate;
}

export function isEliminateOption(maybe: unknown): maybe is EliminateOption {
	const eliminate = maybe as EliminateOption;
	return (maybe != null)
		&& (eliminate.strategyType === BotTurnStrategyType.Eliminate);
}

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
	if (evidenceType == null && evidenceValue == null) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateWild);
	} else if (evidenceValue != null) {
		const markerDelta = evidenceValue * markerMultiplier;
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
	if (stompsExact) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateStompsExact);
	}
	addImpossibleAddedEffectsFromTurn(effects, turn, CardType.Evidence, BotTurnStrategyType.Eliminate, inspector);
	return effects;
}

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
		const firstCard = hand[firstAction.handIndex].possibleValues;
		const secondCard = hand[secondAction.handIndex].possibleValues;
		// in general, we want to eliminate higher-valued cards
		const firstAvg = mean(firstCard);
		const secondAvg = mean(secondCard);
		return secondAvg > firstAvg ? CompareResult.Second : CompareResult.First;
	};
}

export class EliminateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Eliminate;

	public buildOptions(turn: TurnStart, bot: Bot): EliminateOption[] {
		const unconfirmed = unfinishedLeads(turn);
		const unconfirmedEvidenceTypes = unconfirmed.map(lead => lead.leadCard.evidenceType);
		const otherPlayerEvidence = turn.otherPlayers.flatMap(op => op.hand);
		const investigationGap = INVESTIGATION_MARKER_GOAL - turn.board.investigationMarker;
		const stompsExact = turn.otherPlayers
			.flatMap(op => op.hand.map(card => (op.inspector === InspectorType.Gregson ? 2 : 1) * card.evidenceValue))
			.find(v => v === investigationGap) != null;
		const options = bot.hand
			.map(mysteryCard => buildEliminateEffects(mysteryCard, unconfirmedEvidenceTypes, otherPlayerEvidence, turn, bot.inspector, stompsExact))
			.map((effects, handIndex) => buildEliminateOption(effects, handIndex));
		return reduceOptions(options, compareWithHand(bot.hand));
	}
}
