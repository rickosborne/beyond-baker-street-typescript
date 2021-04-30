import { ActionType } from "./ActionType";
import { addEffect } from "./addEffect";
import {
	askOtherPlayersAboutTheirHands,
	OtherCardKnowledge,
	OtherPlayerKnowledge,
} from "./askOtherPlayersAboutTheirHands";
import {
	AssistAction,
	Assisted,
	AssistType,
	isTypeAssistAction,
	isValueAssistAction,
	TypeAssistAction,
	ValueAssistAction,
} from "./AssistAction";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { HOLMES_MOVE_ASSIST, INVESTIGATION_MARKER_GOAL } from "./Game";
import { addHolmesProgressEffects } from "./HolmesProgressEffect";
import { isSamePlayer } from "./Player";
import { strictDeepEqual } from "./strictDeepEqual";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { VisibleLead } from "./VisibleBoard";

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

export interface AssistEffect extends BotTurnEffect, Assisted {
}

/**
 * The other person should now know the exact card.
 */
export interface KnownCardEffect extends AssistEffect {
	effectType: BotTurnEffectType.AssistKnown;
	possibleAfter: 1;
}

/**
 * Generic "you now know more than you did" assist.
 */
export interface NarrowCardEffect extends AssistEffect {
	effectType: BotTurnEffectType.AssistNarrow;
	remainingPossibilities: number;
}

/**
 * When you reveal a type not used by any leads.
 */
export interface AssistImpossibleTypeEffect extends AssistEffect {
	effectType: BotTurnEffectType.AssistImpossibleType;
}

/**
 * Assist the player right after you (presumably helping them on their turn).
 */
export interface AssistNextPlayerEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.AssistNextPlayer;
}

/**
 * Give information leading to perfectly landing the Investigation Marker.
 */
export interface AssistExactEliminateEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.AssistExactEliminate;
}

export function isSameAssistAction(a: AssistAction, b: AssistAction): boolean {
	return a.assistType === b.assistType
		&& isSamePlayer(a.player, b.player)
		&& ((isTypeAssistAction(a) && (a.evidenceType === (b as TypeAssistAction).evidenceType))
			|| (isValueAssistAction(a) && (a.evidenceValue === (b as ValueAssistAction).evidenceValue)));
}

export class AssistStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Assist;

	private buildAssistsForCard(
		otherCardKnowledge: OtherCardKnowledge,
		otherPlayerKnowledge: OtherPlayerKnowledge,
		leads: VisibleLead[],
		turn: TurnStart,
	): AssistTurnOption[] {
		const options: AssistTurnOption[] = [];
		const otherPlayer = otherPlayerKnowledge.otherPlayer;
		const otherCards = otherPlayerKnowledge.knowledge.filter((k, i) => i !== otherCardKnowledge.handIndex);
		const { evidenceCard, unknownCard } = otherCardKnowledge;
		const { evidenceType, evidenceValue } = evidenceCard;
		const otherPossibleBefore = otherCards.reduce((prev, cur) => prev + cur.unknownCard.possibleCount, 0);
		const { possibleCount, possibleTypes, possibleValues } = unknownCard;
		const possibleBefore = possibleCount + otherPossibleBefore;
		const knowsValue = possibleValues.length === 1;
		const knowsType = possibleTypes.length === 1;
		const { holmesLocation, investigationMarker } = turn.board;
		const investigateGap = INVESTIGATION_MARKER_GOAL - investigationMarker;
		if (knowsType && knowsValue) {
			// Nothing to assist
			return options;
		}
		const matchingLeads = leads.filter(lead => lead.leadCard.evidenceType === evidenceType);
		if (!knowsType) {
			// Assist with Type
			const possibleAfter = otherPlayerKnowledge.knowledge.reduce((prev, cur) => {
				const card = cur.unknownCard;
				const types = card.possibleTypes;
				const after = types.includes(evidenceType) ? Math.round(card.possibleCount / types.length) : card.possibleCount;
				return prev + after;
			}, 0);
			const effects: BotTurnEffect[] = [];
			if (matchingLeads.length === 0) {
				addEffect<AssistImpossibleTypeEffect>(effects, {
					effectType: BotTurnEffectType.AssistImpossibleType,
					possibleAfter,
					possibleBefore,
				});
			}
			if (knowsValue) {
				addEffect<KnownCardEffect>(effects, {
					effectType: BotTurnEffectType.AssistKnown,
					possibleAfter: 1,
					possibleBefore,
				});
			} else {
				addEffect<NarrowCardEffect>(effects, {
					effectType: BotTurnEffectType.AssistNarrow,
					possibleAfter,
					possibleBefore,
					remainingPossibilities: possibleValues.length,
				});
			}
			const assistType: TypeAssistTurnOption = {
				action: {
					actionType: ActionType.Assist,
					assistType: AssistType.Type,
					evidenceType,
					player: otherPlayer,
					possibleAfter,
					possibleBefore,
				},
				assistType: AssistType.Type,
				effects,
				evidenceType,
				strategyType: BotTurnStrategyType.Assist,
			};
			options.push(assistType);
		}
		if (!knowsValue) {
			const effects: BotTurnEffect[] = [];
			const possibleAfter = otherPlayerKnowledge.knowledge.reduce((prev, cur) => {
				const card = cur.unknownCard;
				const values = card.possibleValues;
				const after = values.includes(evidenceValue) ? Math.round(card.possibleCount / values.length) : card.possibleCount;
				return prev + after;
			}, 0);
			if (knowsType) {
				addEffect<KnownCardEffect>(effects, {
					effectType: BotTurnEffectType.AssistKnown,
					possibleAfter: 1,
					possibleBefore,
				});
			} else {
				addEffect<NarrowCardEffect>(effects, {
					effectType: BotTurnEffectType.AssistNarrow,
					possibleAfter,
					possibleBefore,
					remainingPossibilities: possibleTypes.length,
				});
			}
			const assistValue: ValueAssistTurnOption = {
				action: {
					actionType: ActionType.Assist,
					assistType: AssistType.Value,
					evidenceValue,
					player: otherPlayer,
					possibleAfter,
					possibleBefore,
				},
				assistType: AssistType.Value,
				effects,
				evidenceValue,
				strategyType: BotTurnStrategyType.Assist,
			};
			options.push(assistValue);
		}
		for (const option of options) {
			addHolmesProgressEffects(option.effects, HOLMES_MOVE_ASSIST, holmesLocation);
			if (isSamePlayer(otherPlayer, turn.nextPlayer)) {
				addEffect<AssistNextPlayerEffect>(option.effects, {
					effectType: BotTurnEffectType.AssistNextPlayer,
				});
			}
			if (matchingLeads.length === 0 && (investigateGap === evidenceValue)) {
				addEffect<AssistExactEliminateEffect>(option.effects, {
					effectType: BotTurnEffectType.AssistExactEliminate,
				});
			}
		}
		return options;
	}

	private buildAssistsForPlayer(
		otherPlayerKnowledge: OtherPlayerKnowledge,
		leads: VisibleLead[],
		turn: TurnStart,
	): AssistTurnOption[] {
		return otherPlayerKnowledge.knowledge
			.flatMap(otherCardKnowledge => this.buildAssistsForCard(otherCardKnowledge, otherPlayerKnowledge, leads, turn))
			.reduce((options, option) => {
				const existing = options.find(o => isSameAssistAction(o.action, option.action));
				if (existing != null) {
					this.mergeEffects(existing.effects, option.effects);
				} else {
					options.push(option);
				}
				return options;
			}, [] as AssistTurnOption[]);
	}

	public buildOptions(turn: TurnStart): BotTurnOption[] {
		const leads = unfinishedLeads(turn);
		return askOtherPlayersAboutTheirHands(turn)
			.flatMap(otherPlayerKnowledge => this.buildAssistsForPlayer(otherPlayerKnowledge, leads, turn))
			;
	}

	private mergeEffects(destination: BotTurnEffect[], source: BotTurnEffect[]): void {
		for (const effect of source) {
			if (destination.findIndex(existing => strictDeepEqual(existing, effect)) < 0) {
				destination.push(effect);
			}
		}
	}
}
