import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import {
	askOtherPlayersAboutTheirHands,
	OtherCardKnowledge,
	OtherPlayerKnowledge,
} from "./askOtherPlayersAboutTheirHands";
import {
	AssistAction,
	AssistType,
	isTypeAssistAction,
	isValueAssistAction,
	TypeAssistAction,
	ValueAssistAction,
} from "./AssistAction";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { HOLMES_MOVE_PROGRESS, INVESTIGATION_MARKER_GOAL } from "./Game";
import { addHolmesProgressEffects } from "./HolmesProgressEffect";
import { InspectorType } from "./InspectorType";
import { isSamePlayer, OtherPlayer, Player } from "./Player";
import { CompareResult, reduceOptions } from "./util/reduceOptions";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unfinishedLeads";
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

export function compareAssistedImpacts(first: AssistAction, b: AssistAction): CompareResult {
	// known is best
	const aAfter = first.possibleAfter;
	const bAfter = b.possibleAfter;
	if (aAfter === 1 && bAfter > 1) {
		return CompareResult.First;
	} else if (bAfter === 1 && aAfter > 1) {
		return CompareResult.Second;
	}
	if (aAfter !== bAfter) {
		// positive means a is wider than b, so b is better
		return aAfter > bAfter ? CompareResult.Second : CompareResult.First;
	}
	// but here, positive means b eliminates more, so b is better
	return b.possibleBefore > first.possibleBefore ? CompareResult.Second : CompareResult.First;
}

export function getPossibleAfterValues(otherPlayerKnowledge: OtherPlayerKnowledge, evidenceValue: EvidenceValue): number {
	return otherPlayerKnowledge.knowledge.reduce((prev, cur) => {
		const card = cur.unknownCard;
		const values = card.possibleValues;
		const after = values.includes(evidenceValue) ? Math.round(card.possibleCount / values.length) : card.possibleCount;
		return prev + after;
	}, 0);
}

export function getPossibleAfterTypes(otherPlayerKnowledge: OtherPlayerKnowledge, evidenceType: EvidenceType): number {
	return otherPlayerKnowledge.knowledge.reduce((prev, cur) => {
		const card = cur.unknownCard;
		const types = card.possibleTypes;
		const after = types.includes(evidenceType) ? Math.round(card.possibleCount / types.length) : card.possibleCount;
		return prev + after;
	}, 0);
}

export function buildValueAssistOption(
	otherPlayerKnowledge: OtherPlayerKnowledge,
	evidenceValue: number,
	possibleBefore: number,
	knowsType: boolean,
	otherPlayer: OtherPlayer,
	options: AssistTurnOption[],
): ValueAssistTurnOption {
	const effects: BotTurnEffectType[] = [];
	const possibleAfter = getPossibleAfterValues(otherPlayerKnowledge, evidenceValue);
	if (knowsType) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.AssistKnown);
	} else {
		addEffectsIfNotPresent(effects, BotTurnEffectType.AssistNarrow);
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
	return assistValue;
}

export function addUsualAssistEffects(
	options: AssistTurnOption[],
	holmesLocation: number,
	otherPlayer: OtherPlayer,
	nextPlayer: Player,
	matchingLeadCount: number,
	investigationGap: number,
	evidenceValue: number,
	otherPlayerIsHope: boolean,
): void {
	for (const option of options) {
		addHolmesProgressEffects(option.effects, HOLMES_MOVE_PROGRESS, holmesLocation);
		if (isSamePlayer(otherPlayer, nextPlayer)) {
			addEffectsIfNotPresent(option.effects, BotTurnEffectType.AssistNextPlayer);
		}
		if (matchingLeadCount === 0 && (investigationGap === evidenceValue)) {
			addEffectsIfNotPresent(option.effects, BotTurnEffectType.AssistExactEliminate);
		}
		if (otherPlayerIsHope) {
			addEffectsIfNotPresent(option.effects, BotTurnEffectType.AssistNotHope);
		}
	}
}

export function buildTypeAssistOption(
	otherPlayerKnowledge: OtherPlayerKnowledge,
	evidenceType: EvidenceType,
	possibleBefore: number,
	matchingLeadCount: number,
	knowsValue: boolean,
	otherPlayer: OtherPlayer,
	options: AssistTurnOption[]
): TypeAssistTurnOption {
	// Assist with Type
	const possibleAfter = getPossibleAfterTypes(otherPlayerKnowledge, evidenceType);
	const effects: BotTurnEffectType[] = [];
	if (matchingLeadCount === 0) {
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
	return assistType;
}

export function canAssistWithType(evidenceType: EvidenceType, inspector: InspectorType | undefined): boolean {
	return !((inspector === InspectorType.Bradstreet && evidenceType === EvidenceType.Document)
		|| (inspector === InspectorType.Forrester && evidenceType === EvidenceType.Clue)
		|| (inspector === InspectorType.Hopkins && evidenceType === EvidenceType.Witness)
		|| (inspector === InspectorType.Jones && evidenceType === EvidenceType.Track));
}

export function buildAssistsForCard(
	otherCardKnowledge: OtherCardKnowledge,
	otherPlayerKnowledge: OtherPlayerKnowledge,
	leads: VisibleLead[],
	turn: TurnStart,
	inspector: InspectorType | undefined,
	otherPlayerIsHope: boolean,
): AssistTurnOption[] {
	const options: AssistTurnOption[] = [];
	const { evidenceCard, unknownCard } = otherCardKnowledge;
	const { possibleCount, possibleTypes, possibleValues } = unknownCard;
	const knowsValue = possibleValues.length === 1;
	const knowsType = possibleTypes.length === 1;
	if (knowsType && knowsValue) {
		// Nothing to assist
		return options;
	}
	const { evidenceType, evidenceValue } = evidenceCard;
	const otherPlayer = otherPlayerKnowledge.otherPlayer;
	const otherCards = otherPlayerKnowledge.knowledge.filter((k, i) => i !== otherCardKnowledge.handIndex);
	const otherPossibleBefore = otherCards.reduce((prev, cur) => prev + cur.unknownCard.possibleCount, 0);
	const possibleBefore = possibleCount + otherPossibleBefore;
	const { holmesLocation, investigationMarker } = turn.board;
	const investigationGap = INVESTIGATION_MARKER_GOAL - investigationMarker;
	const matchingLeads = leads.filter(lead => lead.leadCard.evidenceType === evidenceType);
	if (!knowsType && canAssistWithType(evidenceType, inspector)) {
		buildTypeAssistOption(otherPlayerKnowledge, evidenceType, possibleBefore, matchingLeads.length, knowsValue, otherPlayer, options);
	}
	if (!knowsValue && inspector !== InspectorType.Martin) {
		buildValueAssistOption(otherPlayerKnowledge, evidenceValue, possibleBefore, knowsType, otherPlayer, options);
	}
	addUsualAssistEffects(options, holmesLocation, otherPlayer, turn.nextPlayer, matchingLeads.length, investigationGap, evidenceValue, otherPlayerIsHope);
	return options;
}

export function buildAssistsForPlayer(
	otherPlayerKnowledge: OtherPlayerKnowledge,
	leads: VisibleLead[],
	turn: TurnStart,
	inspector: InspectorType | undefined,
	otherPlayerIsHope: boolean,
): AssistTurnOption[] {
	return otherPlayerKnowledge.knowledge
		.flatMap(otherCardKnowledge => buildAssistsForCard(otherCardKnowledge, otherPlayerKnowledge, leads, turn, inspector, otherPlayerIsHope))
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

export class AssistStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Assist;

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const leads = unfinishedLeads(turn);
		const otherPlayerIsHope = turn.otherPlayers.find(op => op.inspector === InspectorType.Hope) != null;
		const options = askOtherPlayersAboutTheirHands(turn)
			.flatMap(otherPlayerKnowledge => buildAssistsForPlayer(otherPlayerKnowledge, leads, turn, bot.inspector, otherPlayerIsHope));
		return reduceOptions(options, compareAssistedImpacts);
	}
}
