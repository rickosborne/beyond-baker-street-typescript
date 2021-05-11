import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
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
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { uniqueReducer } from "./unique";
import { HasVisibleBoard, VisibleLead } from "./VisibleBoard";

export interface EliminateOption extends BotTurnOption {
	action: EliminateAction;
	strategyType: BotTurnStrategyType.Eliminate;
}

export function isEliminateOption(maybe: unknown): maybe is EliminateOption {
	const eliminate = maybe as EliminateOption;
	return (maybe != null)
		&& (eliminate.strategyType === BotTurnStrategyType.Eliminate);
}

export function buildEffects(
	mysteryCard: MysteryCard,
	unconfirmed: VisibleLead[],
	otherPlayerEvidence: EvidenceCard[],
	turn: HasVisibleBoard,
	inspector: InspectorType | undefined,
): BotTurnEffectType[] {
	const effects: BotTurnEffectType[] = [];
	const investigationMarker = turn.board.investigationMarker;
	const investigationGap = INVESTIGATION_MARKER_GOAL - investigationMarker;
	const { possibleTypes, possibleValues } = mysteryCard;
	const evidenceValue: EvidenceValue | undefined = possibleValues.length === 1 ? possibleValues[0] : undefined;
	const evidenceType: EvidenceType | undefined = possibleTypes.length === 1 ? possibleTypes[0] : undefined;
	const evidenceTypes = unconfirmed.map(lead => lead.leadCard.evidenceType);
	const markerMultiplier = inspector === InspectorType.Gregson ? 2 : 1;
	const maybeUsedEvidenceTypes = evidenceTypes
		.filter(evidenceType => mysteryCard.couldBeType(evidenceType))
		.reduce(uniqueReducer, [] as EvidenceType[])
	;
	if (evidenceType == null && evidenceValue == null) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateWild);
	} else if (evidenceValue != null) {
		const markerDelta = evidenceValue * markerMultiplier;
		if (markerDelta > investigationGap) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
		} else {
			if (markerDelta === investigationGap) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigationComplete);
			}
			if (otherPlayerEvidence.find(e => !evidenceTypes.includes(e.evidenceType) && (e.evidenceValue + evidenceValue === investigationGap)) != null) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateSetsUpExact);
			}
			if (maybeUsedEvidenceTypes.length === 0) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateKnownUnusedValue);
			} else {
				addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateKnownUsedValue);
			}
		}
	} else {  // known type, unknown value
		if (maybeUsedEvidenceTypes.length === 0) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateUnusedType);
		} else {
			addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateUsedType);
		}
		addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateUnknownValue);
	}
	const couldCauseLoss = possibleValues.filter(v => (v * markerMultiplier) > investigationGap).length;
	if (couldCauseLoss > 0) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.MaybeLose);
	}
	addImpossibleAddedEffectsFromTurn(effects, turn, CardType.Evidence, BotTurnStrategyType.Eliminate, inspector);
	return effects;
}

export function buildEliminateOption(
	effects: BotTurnEffectType[],
	handIndex: number,
	stompsExact: boolean,
): EliminateOption {
	if (stompsExact) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.EliminateStompsExact);
	}
	return {
		action: {
			actionType: ActionType.Eliminate,
			handIndex,
		},
		effects,
		strategyType: BotTurnStrategyType.Eliminate,
	};
}

export class EliminateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Eliminate;

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const unconfirmed = unfinishedLeads(turn);
		const otherPlayerEvidence = turn.otherPlayers.flatMap(op => op.hand);
		const investigationGap = INVESTIGATION_MARKER_GOAL - turn.board.investigationMarker;
		const stompsExact = otherPlayerEvidence.find(e => e.evidenceValue === investigationGap) != null;
		return bot.hand
			.map(mysteryCard => buildEffects(mysteryCard, unconfirmed, otherPlayerEvidence, turn, bot.inspector))
			.map((effects, handIndex) => buildEliminateOption(effects, handIndex, stompsExact));
	}
}
