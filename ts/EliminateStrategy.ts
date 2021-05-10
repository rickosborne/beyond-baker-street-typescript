import { ActionType } from "./ActionType";
import { addEffect } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { EliminateAction } from "./EliminateAction";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { addImpossibleAddedEffectsFromTurn } from "./ImpossibleAdded";
import { InspectorType } from "./InspectorType";
import { InvestigationCompleteEffect } from "./InvestigationCompleteEffect";
import { addLoseEffect, MaybeLoseEffect } from "./LoseEffect";
import { MysteryCard } from "./MysteryCard";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { uniqueReducer } from "./unique";
import { HasVisibleBoard, VisibleLead } from "./VisibleBoard";

export interface EliminateOption extends BotTurnOption {
	action: EliminateAction;
	strategyType: BotTurnStrategyType.Eliminate;
}

export interface EliminateUnknownValueEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateUnknownValue;
	impossibleCount: number;
	mysteryCard: MysteryCard;
}

export interface EliminateWildEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateWild;
	impossibleCount: number;
	mysteryCard: MysteryCard;
}

export interface EliminateKnownUnusedValueEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateKnownUnusedValue;
	evidenceTypes: EvidenceType[];
	evidenceValue: EvidenceValue;
	impossibleCount: number;
	investigationMarker: number;
	markerDelta: number;
}

export interface EliminateKnownUsedValueEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateKnownUsedValue;
	evidenceValue: EvidenceValue;
	impossibleCount: number;
	investigationMarker: number;
	markerDelta: number;
	maybeUsedEvidenceTypes: EvidenceType[];
}

export interface EliminateUnusedTypeEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateUnusedType;
	probability4plus: number;
	unusedEvidenceTypes: EvidenceType[];
}

export interface EliminateUsedTypeEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateUsedType;
	maybeUsedEvidenceTypes: EvidenceType[];
}

export interface EliminateStompsExactEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateStompsExact;
}

export interface EliminateSetsUpExactEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateSetsUpExact;
}

export class EliminateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Eliminate;

	public buildEffects(
		mysteryCard: MysteryCard,
		unconfirmed: VisibleLead[],
		otherPlayerEvidence: EvidenceCard[],
		turn: HasVisibleBoard,
		inspector: InspectorType | undefined,
	): BotTurnEffect[] {
		const effects: BotTurnEffect[] = [];
		const impossibleCount = turn.board.impossibleCards.length + 1;
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
			addEffect<EliminateWildEffect>(effects, {
				effectType: BotTurnEffectType.EliminateWild,
				impossibleCount,
				mysteryCard,
			});
		} else if (evidenceValue != null) {
			const markerDelta = evidenceValue * markerMultiplier;
			if (markerDelta > investigationGap) {
				addLoseEffect(effects);
			} else {
				if (markerDelta === investigationGap) {
					addEffect<InvestigationCompleteEffect>(effects, {
						effectType: BotTurnEffectType.InvestigationComplete,
					});
				}
				if (otherPlayerEvidence.find(e => !evidenceTypes.includes(e.evidenceType) && (e.evidenceValue + evidenceValue === investigationGap)) != null) {
					addEffect<EliminateSetsUpExactEffect>(effects, {
						effectType: BotTurnEffectType.EliminateSetsUpExact,
					});
				}
				if (maybeUsedEvidenceTypes.length === 0) {
					addEffect<EliminateKnownUnusedValueEffect>(effects, {
						effectType: BotTurnEffectType.EliminateKnownUnusedValue,
						evidenceTypes: possibleTypes.slice(),
						evidenceValue,
						impossibleCount,
						investigationMarker: investigationMarker + evidenceValue,
						markerDelta,
					});
				} else {
					addEffect<EliminateKnownUsedValueEffect>(effects, {
						effectType: BotTurnEffectType.EliminateKnownUsedValue,
						evidenceValue,
						impossibleCount,
						investigationMarker: investigationMarker + evidenceValue,
						markerDelta,
						maybeUsedEvidenceTypes,
					});
				}
			}
		} else {  // known type, unknown value
			if (maybeUsedEvidenceTypes.length === 0) {
				addEffect<EliminateUnusedTypeEffect>(effects, {
					effectType: BotTurnEffectType.EliminateUnusedType,
					probability4plus: mysteryCard.probabilityOf(e => e.evidenceValue >= 4),
					unusedEvidenceTypes: possibleTypes.slice(),
				});
			} else {
				addEffect<EliminateUsedTypeEffect>(effects, {
					effectType: BotTurnEffectType.EliminateUsedType,
					maybeUsedEvidenceTypes,
				});
			}
			addEffect<EliminateUnknownValueEffect>(effects, {
				effectType: BotTurnEffectType.EliminateUnknownValue,
				impossibleCount,
				mysteryCard,
			});
		}
		const couldCauseLoss = possibleValues.filter(v => (v * markerMultiplier) > investigationGap).length;
		if (couldCauseLoss > 0) {
			addEffect<MaybeLoseEffect>(effects, {
				chance: couldCauseLoss / possibleValues.length,
				effectType: BotTurnEffectType.MaybeLose,
			});
		}
		addImpossibleAddedEffectsFromTurn(effects, turn, CardType.Evidence, this.strategyType, inspector);
		return effects;
	}

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const unconfirmed = unfinishedLeads(turn);
		const otherPlayerEvidence = turn.otherPlayers.flatMap(op => op.hand);
		const investigationGap = INVESTIGATION_MARKER_GOAL - turn.board.investigationMarker;
		const stompsExact = otherPlayerEvidence.find(e => e.evidenceValue === investigationGap) != null;
		return bot.hand
			.map(mysteryCard => this.buildEffects(mysteryCard, unconfirmed, otherPlayerEvidence, turn, bot.inspector))
			.map((effects, handIndex) => {
				if (stompsExact) {
					addEffect<EliminateStompsExactEffect>(effects, {
						effectType: BotTurnEffectType.EliminateStompsExact,
					});
				}
				const option: EliminateOption = {
					action: {
						actionType: ActionType.Eliminate,
						handIndex,
					},
					effects,
					strategyType: BotTurnStrategyType.Eliminate,
				};
				return option;
			});
	}
}

export function isEliminateOption(maybe: unknown): maybe is EliminateOption {
	const eliminate = maybe as EliminateOption;
	return (maybe != null)
		&& (eliminate.strategyType === BotTurnStrategyType.Eliminate);
}
