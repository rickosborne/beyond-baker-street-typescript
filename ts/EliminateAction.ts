import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { EvidenceCard } from "./EvidenceCard";

export interface EliminateAction extends Action<ActionType.Eliminate> {
	actionType: ActionType.Eliminate;
	handIndex: number;
}

export interface EliminateOutcome {
	impossibleCards: EvidenceCard[];
	impossibleFaceDownCount: number;
	investigationMarker: number;
}

export function isEliminateAction(maybe: unknown): maybe is EliminateAction {
	const ea = maybe as EliminateAction;
	// noinspection SuspiciousTypeOfGuard
	return isAction(maybe, ActionType.Eliminate)
		&& (typeof ea.handIndex === "number");
}
