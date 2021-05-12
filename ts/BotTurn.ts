import { Action } from "./Action";
import { Bot } from "./Bot";
import { TurnStart } from "./TurnStart";

export enum BotTurnEffectType {
	AssistExactEliminate = "AssistExactEliminate",
	AssistImpossibleType = "AssistImpossibleType",
	AssistKnown = "AssistKnown",
	AssistNarrow = "AssistNarrow",
	AssistNextPlayer = "AssistNextPlayer",
	Confirm = "Confirm",
	ConfirmEventually = "ConfirmEventually",
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

export const BOT_TURN_EFFECT_TYPES: BotTurnEffectType[] = [
	BotTurnEffectType.AssistExactEliminate,
	BotTurnEffectType.AssistImpossibleType,
	BotTurnEffectType.AssistKnown,
	BotTurnEffectType.AssistNarrow,
	BotTurnEffectType.AssistNextPlayer,
	BotTurnEffectType.Confirm,
	BotTurnEffectType.ConfirmEventually,
	BotTurnEffectType.ConfirmReady,
	BotTurnEffectType.EliminateKnownValueUnusedType,
	BotTurnEffectType.EliminateKnownValueUsedType,
	BotTurnEffectType.EliminateSetsUpExact,
	BotTurnEffectType.EliminateStompsExact,
	BotTurnEffectType.EliminateUnknownValueUnusedType,
	BotTurnEffectType.EliminateUnknownValueUsedType,
	BotTurnEffectType.EliminateWild,
	BotTurnEffectType.HolmesImpeded,
	BotTurnEffectType.HolmesProgress,
	BotTurnEffectType.ImpossibleAdded,
	BotTurnEffectType.InvestigateBadOnWedged,
	BotTurnEffectType.InvestigateCorrectType,
	BotTurnEffectType.InvestigateCorrectValue,
	BotTurnEffectType.InvestigateMaybeBad,
	BotTurnEffectType.InvestigatePerfect,
	BotTurnEffectType.InvestigateWild,
	BotTurnEffectType.InvestigationComplete,
	BotTurnEffectType.Lose,
	BotTurnEffectType.MaybeLose,
	BotTurnEffectType.PursueConfirmable,
	BotTurnEffectType.PursueDuplicate,
	BotTurnEffectType.PursueImpossible,
	BotTurnEffectType.PursueMaybe,
	BotTurnEffectType.PursuePossible,
	BotTurnEffectType.Toby,
	BotTurnEffectType.Win,
];

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
