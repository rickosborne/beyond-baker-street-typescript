import { Action } from "./Action";
import { TurnStart } from "./TurnStart";
import { Bot } from "./Bot";

export enum BotTurnEffectType {
	Confirm = "Confirm",
	EliminateKnownUnusedValue = "EliminateKnownUnusedValue",
	EliminateKnownUsedValue = "EliminateKnownUsedValue",
	EliminateUnknownValue = "EliminateUnknownValue",
	EliminateUnusedType = "EliminateUnusedType",
	EliminateUsedType = "EliminateUsedType",
	EliminateWild = "EliminateWild",
	HolmesImpeded = "HolmesImpeded",
	HolmesProgress = "HolmesProgress",
	KnownCard = "KnownCard",
	Lose = "Lose",
	NarrowCard = "NarrowCard",
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
	Pursue = "Pursue",
}
