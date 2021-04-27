import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { Player } from "./Player";

export enum OutcomeType {
	Assist = "Assist",
	BadInvestigate = "BadInvestigate",
	Confirm = "Confirm",
	DeadLead = "DeadLead",
	Eliminate = "Eliminate",
	GoodInvestigate = "GoodInvestigate",
	Pursue = "Pursue",
}

export interface Outcome {
	action: Action;
	activePlayer: Player;
	outcomeType: OutcomeType;
}
