import { Action } from "./Action";
import { Player } from "./Player";

export enum OutcomeType {
	Adler = "Adler",
	Assist = "Assist",
	BadInvestigate = "BadInvestigate",
	Baskerville = "Baskerville",
	Confirm = "Confirm",
	DeadLead = "DeadLead",
	Eliminate = "Eliminate",
	GoodInvestigate = "GoodInvestigate",
	Hope = "Hope",
	Hudson = "Hudson",
	Pike = "Pike",
	Pursue = "Pursue",
	Toby = "Toby",
}

export interface Outcome {
	readonly action: Action;
	readonly activePlayer: Player;
	readonly outcomeType: OutcomeType;
}

export interface TypedOutcome<T extends OutcomeType> extends Outcome {
	outcomeType: T;
}
