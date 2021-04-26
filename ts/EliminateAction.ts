import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { Outcome } from "./Outcome";
import { ImpossibleCard } from "./Impossible";

export interface EliminateAction extends Action<ActionType.Eliminate> {
	actionType: ActionType.Eliminate;
	handIndex: number;
}

export interface EliminateOutcome extends Outcome {
	impossibleCards: ImpossibleCard[];
	impossibleFaceDownCount: number;
	investigationMarker: number;
}

export function isEliminateAction(maybe: unknown): maybe is EliminateAction {
	const ea = maybe as EliminateAction;
	// noinspection SuspiciousTypeOfGuard
	return isAction(maybe, ActionType.Eliminate)
		&& (typeof ea.handIndex === "number");
}
