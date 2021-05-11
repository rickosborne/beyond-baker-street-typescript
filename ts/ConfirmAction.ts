import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player } from "./Player";

export interface ConfirmAction extends Action {
	actionType: ActionType.Confirm;
	leadType: LeadType;
}

export interface ConfirmOutcome extends Outcome {
	action: ConfirmAction;
	confirmedLeadTypes: LeadType[];
	holmesLocation: number;
	outcomeType: OutcomeType.Confirm;
	unconfirmedLeadTypes: LeadType[];
}

export function isConfirmAction(maybe: unknown): maybe is ConfirmAction {
	const ca = maybe as ConfirmAction;
	return isActionOfType(maybe, ActionType.Confirm)
		&& isLeadType(ca.leadType);
}

export function isConfirmOutcome(maybe: unknown): maybe is ConfirmOutcome {
	const o = maybe as ConfirmOutcome;
	return (o != null) && (o.outcomeType === OutcomeType.Confirm);
}

export function formatConfirm(confirm: ConfirmAction, player: Player, holmesLocation: number): string {
	return `${player.name} confirms ${confirm.leadType}.  Holmes is at ${holmesLocation}.`;
}

export function formatConfirmOutcome(outcome: ConfirmOutcome): string {
	return `${outcome.activePlayer.name} confirmed ${outcome.action.leadType}, for ${outcome.confirmedLeadTypes.length} confirmed and ${outcome.unconfirmedLeadTypes.length} unconfirmed.  Holmes is at ${outcome.holmesLocation}.`;
}
