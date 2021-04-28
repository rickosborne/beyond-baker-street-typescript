import { Action } from "./Action";
import { TurnStart } from "./TurnStart";
import { Bot } from "./Bot";

export enum BotTurnEffectType {
	AssistKnown = "AssistKnown",
	AssistNarrow = "AssistNarrow",
	Confirm = "Confirm",
	EliminateKnownUnusedValue = "EliminateKnownUnusedValue",
	EliminateKnownUsedValue = "EliminateKnownUsedValue",
	EliminateUnknownValue = "EliminateUnknownValue",
	EliminateUnusedType = "EliminateUnusedType",
	EliminateUsedType = "EliminateUsedType",
	EliminateWild = "EliminateWild",
	HolmesImpeded = "HolmesImpeded",
	HolmesProgress = "HolmesProgress",
	InvestigateBad = "InvestigateBad",
	InvestigateCorrectType = "InvestigateCorrectType",
	InvestigateCorrectValue = "InvestigateCorrectValue",
	InvestigateMaybeBad = "InvestigateMaybeBad",
	InvestigatePerfect = "InvestigatePerfect",
	InvestigateWild = "InvestigateWild",
	Lose = "Lose",
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
