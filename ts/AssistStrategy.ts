import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import {
	askOtherPlayersAboutTheirHands,
	OtherCardKnowledge,
	OtherPlayerKnowledge,
} from "./askOtherPlayersAboutTheirHands";
import {
	AssistAction,
	assistRatioFromPossible,
	AssistType,
	isTypeAssistAction,
	isValueAssistAction,
	TypeAssistAction,
	ValueAssistAction,
} from "./AssistAction";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { HOLMES_MOVE_PROGRESS, INVESTIGATION_MARKER_GOAL } from "./Game";
import { addHolmesProgressEffects } from "./HolmesProgressEffect";
import { isSamePlayer, OtherPlayer } from "./Player";
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
				addEffectsIfNotPresent(option.effects, BotTurnEffectType.AssistNextPlayer);
			}
			if (matchingLeads.length === 0 && (investigateGap === evidenceValue)) {
				addEffectsIfNotPresent(option.effects, BotTurnEffectType.AssistExactEliminate);
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
			this.buildTypeAssistOption(otherPlayerKnowledge, evidenceType, possibleBefore, matchingLeads, knowsValue, otherPlayer, options);
		}
		if (!knowsValue) {
			this.buildValueAssistOption(otherPlayerKnowledge, evidenceValue, possibleBefore, knowsType, otherPlayer, options);
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
					addEffectsIfNotPresent(existing.effects, ...option.effects);
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

	private buildTypeAssistOption(
		otherPlayerKnowledge: OtherPlayerKnowledge,
		evidenceType: EvidenceType,
		possibleBefore: number,
		matchingLeads: VisibleLead[],
		knowsValue: boolean,
		otherPlayer: OtherPlayer,
		options: AssistTurnOption[]
	): void {
		// Assist with Type
		const possibleAfter = this.getPossibleAfterTypes(otherPlayerKnowledge, evidenceType);
		const assistRatio = assistRatioFromPossible(possibleBefore, possibleAfter);
		const effects: BotTurnEffectType[] = [];
		if (matchingLeads.length === 0) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.AssistImpossibleType);
		}
		if (knowsValue) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.AssistKnown);
		} else {
			addEffectsIfNotPresent(effects, BotTurnEffectType.AssistNarrow);
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

	private buildValueAssistOption(
		otherPlayerKnowledge: OtherPlayerKnowledge,
		evidenceValue: number,
		possibleBefore: number,
		knowsType: boolean,
		otherPlayer: OtherPlayer,
		options: AssistTurnOption[],
	): void {
		const effects: BotTurnEffectType[] = [];
		const possibleAfter = this.getPossibleAfterValues(otherPlayerKnowledge, evidenceValue);
		const assistRatio = assistRatioFromPossible(possibleBefore, possibleAfter);
		if (knowsType) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.AssistKnown);
		} else {
			addEffectsIfNotPresent(effects, BotTurnEffectType.AssistNarrow);
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
}
