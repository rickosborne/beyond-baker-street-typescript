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
	assistRatioFromPossible,
	AssistType,
	isTypeAssistAction,
	isValueAssistAction,
	TypeAssistAction,
	ValueAssistAction,
} from "./AssistAction";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { HOLMES_MOVE_PROGRESS, INVESTIGATION_MARKER_GOAL } from "./Game";
import { addHolmesProgressEffects } from "./HolmesProgressEffect";
import { isSamePlayer, OtherPlayer } from "./Player";
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
export interface AssistKnownCardEffect extends AssistEffect {
	effectType: BotTurnEffectType.AssistKnown;
	evidenceType: EvidenceType;  // to avoid duplicates
	evidenceValue: EvidenceValue;  // to avoid duplicates
	playerName: string;  // to avoid duplicates
	possibleAfter: 1;
}

/**
 * Generic "you now know more than you did" assist.
 */
export interface NarrowCardEffect extends AssistEffect {
	effectType: BotTurnEffectType.AssistNarrow;
	evidenceType: EvidenceType;  // to avoid duplicates
	evidenceValue: EvidenceValue;  // to avoid duplicates
	playerName: string;  // to avoid duplicates
	remainingPossibilities: number;
}

/**
 * When you reveal a type not used by any leads.
 */
export interface AssistImpossibleTypeEffect extends AssistEffect {
	effectType: BotTurnEffectType.AssistImpossibleType;
	evidenceType: EvidenceType;
	playerName: string;  // to avoid duplicates
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

export function isAssistOption(maybe: unknown): maybe is AssistTurnOption {
	return (maybe != null) && ((maybe as AssistTurnOption).strategyType === BotTurnStrategyType.Assist);
}

export function isAssistTypeOption(maybe: unknown): maybe is TypeAssistTurnOption {
	return isAssistOption(maybe) && ((maybe as TypeAssistTurnOption).assistType === AssistType.Type);
}

export function isAssistValueOption(maybe: unknown): maybe is ValueAssistTurnOption {
	return isAssistOption(maybe) && ((maybe as ValueAssistTurnOption).assistType === AssistType.Value);
}

export class AssistStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Assist;

	// noinspection JSMethodCanBeStatic
	private addUsualAssistEffects(
		options: AssistTurnOption[],
		holmesLocation: number,
		otherPlayer: OtherPlayer,
		turn: TurnStart,
		matchingLeads: VisibleLead[],
		investigateGap: number,
		evidenceValue: number,
	): void {
		for (const option of options) {
			addHolmesProgressEffects(option.effects, HOLMES_MOVE_PROGRESS, holmesLocation);
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
	}


	private buildAssistsForCard(
		otherCardKnowledge: OtherCardKnowledge,
		otherPlayerKnowledge: OtherPlayerKnowledge,
		leads: VisibleLead[],
		turn: TurnStart,
	): AssistTurnOption[] {
		const options: AssistTurnOption[] = [];
		const otherPlayer = otherPlayerKnowledge.otherPlayer;
		const playerName = otherPlayer.name;
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
			this.buildTypeAssistOption(otherPlayerKnowledge, evidenceType, possibleBefore, matchingLeads, playerName, knowsValue, evidenceValue, possibleValues, otherPlayer, options);
		}
		if (!knowsValue) {
			this.buildValueAssistOption(otherPlayerKnowledge, evidenceValue, possibleBefore, knowsType, evidenceType, playerName, possibleTypes, otherPlayer, options);
		}
		this.addUsualAssistEffects(options, holmesLocation, otherPlayer, turn, matchingLeads, investigateGap, evidenceValue);
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

	private buildTypeAssistOption(otherPlayerKnowledge: OtherPlayerKnowledge, evidenceType: EvidenceType, possibleBefore: number, matchingLeads: VisibleLead[], playerName: string, knowsValue: boolean, evidenceValue: number, possibleValues: EvidenceValue[], otherPlayer: OtherPlayer, options: AssistTurnOption[]): void {
		// Assist with Type
		const possibleAfter = this.getPossibleAfterTypes(otherPlayerKnowledge, evidenceType);
		const assistRatio = assistRatioFromPossible(possibleBefore, possibleAfter);
		const effects: BotTurnEffect[] = [];
		if (matchingLeads.length === 0) {
			addEffect<AssistImpossibleTypeEffect>(effects, {
				assistRatio,
				effectType: BotTurnEffectType.AssistImpossibleType,
				evidenceType,
				playerName,
				possibleAfter,
				possibleBefore,
			});
		}
		if (knowsValue) {
			addEffect<AssistKnownCardEffect>(effects, {
				assistRatio,
				effectType: BotTurnEffectType.AssistKnown,
				evidenceType,
				evidenceValue,
				playerName,
				possibleAfter: 1,
				possibleBefore,
			});
		} else {
			addEffect<NarrowCardEffect>(effects, {
				assistRatio,
				effectType: BotTurnEffectType.AssistNarrow,
				evidenceType,
				evidenceValue,
				playerName,
				possibleAfter,
				possibleBefore,
				remainingPossibilities: possibleValues.length,
			});
		}
		const assistType: TypeAssistTurnOption = {
			action: {
				actionType: ActionType.Assist,
				assistRatio,
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

	private buildValueAssistOption(otherPlayerKnowledge: OtherPlayerKnowledge, evidenceValue: number, possibleBefore: number, knowsType: boolean, evidenceType: EvidenceType, playerName: string, possibleTypes: EvidenceType[], otherPlayer: OtherPlayer, options: AssistTurnOption[]): void {
		const effects: BotTurnEffect[] = [];
		const possibleAfter = this.getPossibleAfterValues(otherPlayerKnowledge, evidenceValue);
		const assistRatio = assistRatioFromPossible(possibleBefore, possibleAfter);
		if (knowsType) {
			addEffect<AssistKnownCardEffect>(effects, {
				assistRatio,
				effectType: BotTurnEffectType.AssistKnown,
				evidenceType,
				evidenceValue,
				playerName,
				possibleAfter: 1,
				possibleBefore,
			});
		} else {
			addEffect<NarrowCardEffect>(effects, {
				assistRatio,
				effectType: BotTurnEffectType.AssistNarrow,
				evidenceType,
				evidenceValue,
				playerName,
				possibleAfter,
				possibleBefore,
				remainingPossibilities: possibleTypes.length,
			});
		}
		const assistValue: ValueAssistTurnOption = {
			action: {
				actionType: ActionType.Assist,
				assistRatio,
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

	private getPossibleAfterTypes(otherPlayerKnowledge: OtherPlayerKnowledge, evidenceType: EvidenceType): number {
		return otherPlayerKnowledge.knowledge.reduce((prev, cur) => {
			const card = cur.unknownCard;
			const types = card.possibleTypes;
			const after = types.includes(evidenceType) ? Math.round(card.possibleCount / types.length) : card.possibleCount;
			return prev + after;
		}, 0);
	}

	private getPossibleAfterValues(otherPlayerKnowledge: OtherPlayerKnowledge, evidenceValue: number): number {
		return otherPlayerKnowledge.knowledge.reduce((prev, cur) => {
			const card = cur.unknownCard;
			const values = card.possibleValues;
			const after = values.includes(evidenceValue) ? Math.round(card.possibleCount / values.length) : card.possibleCount;
			return prev + after;
		}, 0);
	}

	private mergeEffects(destination: BotTurnEffect[], source: BotTurnEffect[]): void {
		for (const effect of source) {
			if (destination.findIndex(existing => strictDeepEqual(existing, effect)) < 0) {
				destination.push(effect);
			}
		}
	}
}
