import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { TurnStart } from "./TurnStart";
import { Bot } from "./Bot";
import { EliminateAction } from "./EliminateAction";
import { ActionType } from "./ActionType";
import { MysteryCard } from "./MysteryCard";
import { EvidenceValue } from "./EvidenceValue";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { LoseEffect } from "./LoseEffect";
import { EvidenceType } from "./EvidenceType";
import { LEAD_TYPES } from "./LeadType";
import { unique } from "./unique";

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
}

export interface EliminateKnownUsedValueEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateKnownUsedValue;
	evidenceValue: EvidenceValue;
	impossibleCount: number;
	investigationMarker: number;
	maybeUsedEvidenceTypes: EvidenceType[];
}

export interface EliminateUnusedTypeEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateUnusedType;
	unusedEvidenceTypes: EvidenceType[];
}

export interface EliminateUsedTypeEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.EliminateUsedType;
	maybeUsedEvidenceTypes: EvidenceType[];
}

export class EliminateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Eliminate;

	// noinspection JSMethodCanBeStatic
	private buildEffects(mysteryCard: MysteryCard, turn: TurnStart): BotTurnEffect[] {
		const effects: BotTurnEffect[] = [];
		const impossibleCount = turn.board.impossibleCards.length + 1;
		const investigationMarker = turn.board.investigationMarker;
		const evidenceValue: EvidenceValue | undefined = mysteryCard.possibleValues.length === 1 ? mysteryCard.possibleValues[0] : undefined;
		const evidenceType: EvidenceType | undefined = mysteryCard.possibleTypes.length === 1 ? mysteryCard.possibleTypes[0] : undefined;
		const maybeUsedEvidenceTypes = unique(LEAD_TYPES.map(leadType => turn.board.leads[leadType])
			.filter(lead => !lead.confirmed)
			.map(lead => lead.leadCard.evidenceType)
			.filter(evidenceType => mysteryCard.possibleTypes.includes(evidenceType)));
		if (evidenceType == null && evidenceValue == null) {
			const unknownEffect: EliminateWildEffect = {
				effectType: BotTurnEffectType.EliminateWild,
				impossibleCount,
				mysteryCard,
			};
			effects.push(unknownEffect);
		} else if (evidenceValue != null) {
			if (investigationMarker + evidenceValue > INVESTIGATION_MARKER_GOAL) {
				const lose: LoseEffect = {
					effectType: BotTurnEffectType.Lose,
				};
				effects.push(lose);
			} else if (maybeUsedEvidenceTypes.length === 0) {
				const known: EliminateKnownUnusedValueEffect = {
					effectType: BotTurnEffectType.EliminateKnownUnusedValue,
					evidenceTypes: mysteryCard.possibleTypes.slice(),
					evidenceValue,
					impossibleCount,
					investigationMarker: investigationMarker + evidenceValue,
				};
				effects.push(known);
			} else {
				const known: EliminateKnownUsedValueEffect = {
					effectType: BotTurnEffectType.EliminateKnownUsedValue,
					evidenceValue,
					impossibleCount,
					investigationMarker: investigationMarker + evidenceValue,
					maybeUsedEvidenceTypes,
				};
				effects.push(known);
			}
		} else {  // known type, unknown value
			if (maybeUsedEvidenceTypes.length === 0) {
				const unused: EliminateUnusedTypeEffect = {
					effectType: BotTurnEffectType.EliminateUnusedType,
					unusedEvidenceTypes: mysteryCard.possibleTypes.slice(),
				};
				effects.push(unused);
			} else {
				const maybeUsed: EliminateUsedTypeEffect = {
					effectType: BotTurnEffectType.EliminateUsedType,
					maybeUsedEvidenceTypes,
				};
				effects.push(maybeUsed);
			}
			const unknownEffect: EliminateUnknownValueEffect = {
				effectType: BotTurnEffectType.EliminateUnknownValue,
				impossibleCount,
				mysteryCard,
			};
			effects.push(unknownEffect);
		}
		return effects;
	}

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const options: BotTurnOption[] = [];
		for (let handIndex = 0; handIndex < bot.hand.length; handIndex++) {
			const mysteryCard = bot.hand[handIndex];
			const effects: BotTurnEffect[] = this.buildEffects(mysteryCard, turn);
			const option: EliminateOption = {
				action: {
					actionType: ActionType.Eliminate,
					handIndex,
				},
				effects,
				strategyType: BotTurnStrategyType.Eliminate,
			};
			options.push(option);
		}
		return options;
	}
}
