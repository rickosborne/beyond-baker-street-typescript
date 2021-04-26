import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { Outcome } from "./Outcome";

export interface ConfirmAction extends Action<ActionType.Confirm> {
	actionType: ActionType.Confirm;
	leadType: LeadType;
}

export interface ConfirmOutcome extends Outcome {
	confirmedLeadTypes: LeadType[];
	holmesLocation: number;
	unconfirmedLeadTypes: LeadType[];
}

export function isConfirmAction(maybe: unknown): maybe is ConfirmAction {
	const ca = maybe as ConfirmAction;
	return isAction(maybe, ActionType.Confirm)
		&& isLeadType(ca.leadType);
}
