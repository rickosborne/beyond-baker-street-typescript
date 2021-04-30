import { Action } from "./Action";
import { TurnStart } from "./TurnStart";
import { Bot } from "./Bot";

export enum BotTurnEffectType {
	AssistExactEliminate = "AssistExactEliminate",
	AssistImpossibleType = "AssistImpossibleType",
	AssistKnown = "AssistKnown",
	AssistNarrow = "AssistNarrow",
	AssistNextPlayer = "AssistNextPlayer",
	Confirm = "Confirm",
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
	Lose = "Lose",
	MaybeLose = "MaybeLose",
	PursueDuplicate = "PursueDuplicate",
	PursueImpossible = "PursueImpossible",
	PursueMaybe = "PursueMaybe",
	PursuePossible = "PursuePossible",
	Win = "Win",
}

export interface BotTurnEffect {
	effectType: BotTurnEffectType;
}

export interface BotTurnOption {
	action: Action;
	effects: BotTurnEffect[];
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
	Investigate = "Investigate",
	Pursue = "Pursue",
}
