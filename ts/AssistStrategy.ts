import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { TurnStart } from "./TurnStart";
import { EvidenceType } from "./EvidenceType";
import { OtherHand } from "./OtherHand";
import { AssistAction, AssistType, TypeAssistAction, ValueAssistAction } from "./AssistAction";
import { ActionType } from "./ActionType";
import { isSamePlayer, OtherPlayer, Player } from "./Player";
import { EvidenceValue } from "./EvidenceValue";
import { UnknownCard } from "./MysteryCard";
import { HolmesProgressEffect } from "./HolmesProgressEffect";
import { HOLMES_GOAL } from "./Game";
import { LoseEffect } from "./LoseEffect";

export interface AssistTurnOption extends BotTurnOption {
	action: AssistAction;
	assistType: AssistType;
	strategyType: BotTurnStrategyType.Assist;
}

export interface TypeAssistTurnOption extends AssistTurnOption {
	action: TypeAssistAction;
	assistType: AssistType.Type;
	evidenceType: EvidenceType;
}

export interface ValueAssistTurnOption extends AssistTurnOption {
	action: ValueAssistAction;
	assistType: AssistType.Value;
	evidenceValue: EvidenceValue;
}

export interface KnownCardEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.AssistKnown;
}

export interface NarrowCardEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.AssistNarrow;
	remainingPossibilities: number;
}

export function isTypeAssistTurnOption(maybe: unknown): maybe is TypeAssistTurnOption {
	return (maybe != null) && ((maybe as TypeAssistTurnOption).assistType === AssistType.Type);
}

export function isValueAssistTurnOption(maybe: unknown): maybe is ValueAssistTurnOption {
	return (maybe != null) && ((maybe as ValueAssistTurnOption).assistType === AssistType.Value);
}

export class AssistStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Assist;

	private buildEffects<A extends EvidenceType | EvidenceValue, O extends EvidenceType | EvidenceValue>(
		otherHand: OtherHand,
		assisted: A,
		assistTypesFromCard: (card: UnknownCard) => A[],
		otherTypesFromCard: (card: UnknownCard) => O[],
		turnStart: TurnStart,
	): BotTurnEffect[] {
		const cardEffects = otherHand.hand
			.map(card => {
				const assistTypes = assistTypesFromCard(card);
				const otherTypes = otherTypesFromCard(card);
				if (assistTypes.length === 1 && otherTypes.length === 1) {
					// already a specific card, no new knowledge
					return undefined;
				} else if (assistTypes.length === 1 && assistTypes.includes(assisted)) {
					// already know this type, no new knowledge
					return undefined;
				} else if (assistTypes.length === 1) {
					// another type already, no new knowledge
					return undefined;
				} else if (assistTypes.length === 0) {
					// No cards of this type
					return undefined;
				} else if (otherTypes.length === 1) {
					return <KnownCardEffect>{
						effectType: BotTurnEffectType.AssistKnown,
					};
				} else {
					return <NarrowCardEffect>{
						effectType: BotTurnEffectType.AssistNarrow,
						remainingPossibilities: otherTypes.length,
					};
				}
			})
			.filter(card => card != null) as BotTurnEffect[];
		cardEffects.push(<HolmesProgressEffect> {
			delta: -1,
			effectType: BotTurnEffectType.HolmesProgress,
		});
		if (turnStart.board.holmesLocation === (HOLMES_GOAL + 1)) {
			cardEffects.push(<LoseEffect> {
				effectType: BotTurnEffectType.Lose,
			});
		}
		return cardEffects;
	}

	public buildOptions(turn: TurnStart): BotTurnOption[] {
		const options: AssistTurnOption[] = [];
		for (const otherPlayer of turn.otherPlayers) {
			const otherHand = turn.askOtherPlayerAboutTheirHand(otherPlayer);
			for (const unknownCard of otherHand.hand) {
				if (unknownCard.possibleTypes.length > 1) {
					for (const possibleType of unknownCard.possibleTypes) {
						this.buildTypeAssist(possibleType, otherPlayer, otherHand, options, turn);
					}
				}
				if (unknownCard.possibleValues.length > 1) {
					for (const possibleValue of unknownCard.possibleValues) {
						this.buildValueAssist(possibleValue, otherPlayer, otherHand, options, turn);
					}
				}
			}
		}
		return options;
	}

	private buildTypeAssist(
		evidenceType: EvidenceType,
		otherPlayer: Player,
		otherHand: OtherHand,
		options: AssistTurnOption[],
		turnStart: TurnStart,
	): void {
		if (options.find(o => isTypeAssistTurnOption(o) && o.evidenceType === evidenceType && isSamePlayer(o.action.player, otherPlayer)) != null) {
			// already calculated this assist type
			return;
		}
		const effects: BotTurnEffect[] = this.buildEffects(otherHand, evidenceType, c => c.possibleTypes, c => c.possibleValues, turnStart);
		if (effects.length === 0) {
			// no new knowledge
			return;
		}
		const assist: TypeAssistTurnOption = {
			action: {
				actionType: ActionType.Assist,
				assistType: AssistType.Type,
				evidenceType,
				player: otherPlayer,
			},
			assistType: AssistType.Type,
			effects,
			evidenceType,
			strategyType: BotTurnStrategyType.Assist,
		};
		options.push(assist);
	}

	private buildValueAssist(
		evidenceValue: EvidenceValue,
		otherPlayer: OtherPlayer,
		otherHand: OtherHand,
		options: AssistTurnOption[],
		turnStart: TurnStart,
	): void {
		if (options.find(o => isValueAssistTurnOption(o) && o.evidenceValue === evidenceValue && isSamePlayer(o.action.player, otherPlayer)) != null) {
			// already calculated this assist type
			return;
		}
		const effects: BotTurnEffect[] = this.buildEffects(otherHand, evidenceValue, c => c.possibleValues, c => c.possibleTypes, turnStart);
		if (effects.length === 0) {
			// no new knowledge
			return;
		}
		const assist: ValueAssistTurnOption = {
			action: {
				actionType: ActionType.Assist,
				assistType: AssistType.Value,
				evidenceValue,
				player: otherPlayer,
			},
			assistType: AssistType.Value,
			effects,
			evidenceValue,
			strategyType: BotTurnStrategyType.Assist,
		};
		options.push(assist);
	}
}
