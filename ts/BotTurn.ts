import { Action } from "./Action";
import { Bot } from "./Bot";
import { TurnStart } from "./TurnStart";

export enum BotTurnEffectType {
	AssistNotHope = "AssistNotHope",
	AssistExactEliminate = "AssistExactEliminate",
	AssistImpossibleType = "AssistImpossibleType",
	AssistKnown = "AssistKnown",
	AssistNarrow = "AssistNarrow",
	AssistNextPlayer = "AssistNextPlayer",
	Confirm = "Confirm",
	ConfirmEventually = "ConfirmEventually",
	ConfirmNotBaynes = "ConfirmNotBaynes",
	ConfirmReady = "ConfirmReady",
	EliminateKnownValueUnusedType = "EliminateKnownValueUnusedType",
	EliminateKnownValueUsedType = "EliminateKnownValueUsedType",
	EliminateSetsUpExact = "EliminateSetsUpExact",
	EliminateStompsExact = "EliminateStompsExact",
	EliminateUnknownValueUnusedType = "EliminateUnknownValueUnusedType",
	EliminateUnknownValueUsedType = "EliminateUnknownValueUsedType",
	EliminateWild = "EliminateWild",
	HolmesImpeded = "HolmesImpeded",
	HolmesProgress = "HolmesProgress",
	ImpossibleAdded = "ImpossibleAdded",
	InvestigateBadOnWedged = "InvestigateBadOnWedged",
	InvestigateBadOnUnwedged = "InvestigateBadOnUnwedged",
	InvestigateCorrectType = "InvestigateCorrectType",
	InvestigateCorrectValue = "InvestigateCorrectValue",
	InvestigateMaybeBad = "InvestigateMaybeBad",
	InvestigatePerfect = "InvestigatePerfect",
	/**
	 * An investigation is currently wedged, but adding this bad card would unwedge it.
	 */
	InvestigateUnwedgeWithBad = "InvestigateUnwedgeWithBad",
	InvestigateWild = "InvestigateWild",
	/**
	 * When you put down evidence which prevents the lead from being solved due to available cards.
	 */
	InvestigateWouldWedge = "InvestigateWouldWedge",
	InvestigationComplete = "InvestigationComplete",
	Lose = "Lose",
	MaybeLose = "MaybeLose",
	PursueConfirmable = "PursueConfirmable",
	PursueDuplicate = "PursueDuplicate",
	PursueImpossible = "PursueImpossible",
	PursueMaybe = "PursueMaybe",
	PursuePossible = "PursuePossible",
	Toby = "Toby",
	Win = "Win",
}

// noinspection SuspiciousTypeOfGuard
export const BOT_TURN_EFFECT_TYPES: BotTurnEffectType[] = Object.values(BotTurnEffectType).filter(v => typeof v === "string");

export function isBotTurnEffectType(maybe: unknown): maybe is BotTurnEffectType {
	return (maybe != null)
		&& (typeof maybe === "string")
		&& BOT_TURN_EFFECT_TYPES.includes(maybe as BotTurnEffectType);
}

export interface BotTurnOption {
	action: Action;
	effects: BotTurnEffectType[];
	strategyType: BotTurnStrategyType;
}

export interface BotTurnStrategy {
	buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[];
	strategyType: BotTurnStrategyType;
}

export enum BotTurnStrategyType {
	Assist = "Assist",
	Confirm = "Confirm",
	Eliminate = "Eliminate",
	Inspector = "Inspector",
	Investigate = "Investigate",
	Pursue = "Pursue",
}
