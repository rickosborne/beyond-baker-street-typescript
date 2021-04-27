import { Action } from "./Action";
import { formatAssist, isTypeAssistAction, isValueAssistAction } from "./AssistAction";
import { Player } from "./Player";
import { TurnStart } from "./TurnStart";
import { formatConfirm, isConfirmAction } from "./ConfirmAction";
import { formatEliminate, isEliminateAction } from "./EliminateAction";
import { formatInvestigate, isInvestigateAction } from "./InvestigateAction";
import { formatPursue, isPursueAction } from "./PursueAction";

export function formatAction(action: Action, turnStart: TurnStart): string {
	if (isValueAssistAction(action) || isTypeAssistAction(action)) {
		return formatAssist(action, turnStart.player, turnStart.board.holmesLocation);
	} else if (isConfirmAction(action)) {
		return formatConfirm(action, turnStart);
	} else if (isEliminateAction(action)) {
		return formatEliminate(action, undefined, turnStart);
	} else if (isInvestigateAction(action)) {
		return formatInvestigate(action, turnStart);
	} else if (isPursueAction(action)) {
		return formatPursue(action, turnStart);
	} else {
		throw new Error(`Unknown action type: ${action.actionType}`);
	}
}
