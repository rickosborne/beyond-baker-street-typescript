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
	EliminateKnownUnusedValue = "EliminateKnownUnusedValue",
	EliminateKnownUsedValue = "EliminateKnownUsedValue",
	EliminateSetsUpExact = "EliminateSetsUpExact",
	EliminateStompsExact = "EliminateStompsExact",
	EliminateUnknownValue = "EliminateUnknownValue",
	EliminateUnusedType = "EliminateUnusedType",
	EliminateUsedType = "EliminateUsedType",
	EliminateWild = "EliminateWild",
	HolmesImpeded = "HolmesImpeded",
	HolmesProgress = "HolmesProgress",
	ImpossibleAdded = "ImpossibleAdded",
	InvestigateBad = "InvestigateBad",
	InvestigateCorrectType = "InvestigateCorrectType",
	InvestigateCorrectValue = "InvestigateCorrectValue",
	InvestigateMaybeBad = "InvestigateMaybeBad",
	InvestigatePerfect = "InvestigatePerfect",
	InvestigateWild = "InvestigateWild",
	InvestigationComplete = "InvestigationComplete",
	Lose = "Lose",
	MaybeLose = "MaybeLose",
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
	BotTurnEffectType.EliminateKnownUnusedValue,
	BotTurnEffectType.EliminateKnownUsedValue,
	BotTurnEffectType.EliminateSetsUpExact,
	BotTurnEffectType.EliminateStompsExact,
	BotTurnEffectType.EliminateUnknownValue,
	BotTurnEffectType.EliminateUnusedType,
	BotTurnEffectType.EliminateUsedType,
	BotTurnEffectType.EliminateWild,
	BotTurnEffectType.HolmesImpeded,
	BotTurnEffectType.HolmesProgress,
	BotTurnEffectType.ImpossibleAdded,
	BotTurnEffectType.InvestigateBad,
	BotTurnEffectType.InvestigateCorrectType,
	BotTurnEffectType.InvestigateCorrectValue,
	BotTurnEffectType.InvestigateMaybeBad,
	BotTurnEffectType.InvestigatePerfect,
	BotTurnEffectType.InvestigateWild,
	BotTurnEffectType.InvestigationComplete,
	BotTurnEffectType.Lose,
	BotTurnEffectType.MaybeLose,
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
