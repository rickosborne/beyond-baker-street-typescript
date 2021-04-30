import { Action } from "./Action";
import { formatAssist, isTypeAssistAction, isValueAssistAction } from "./AssistAction";
import { formatConfirm, isConfirmAction } from "./ConfirmAction";
import { formatEliminate, isEliminateAction } from "./EliminateAction";
import { formatInvestigate, isInvestigateAction } from "./InvestigateAction";
import { hasMysteryHand } from "./MysteryCard";
import { Player } from "./Player";
import { formatPursue, isPursueAction } from "./PursueAction";
import { TurnStart } from "./TurnStart";

export function formatAction(action: Action, player: Player, turnStart: TurnStart): string {
	if (isValueAssistAction(action) || isTypeAssistAction(action)) {
		return formatAssist(action, turnStart.player, turnStart.board.holmesLocation);
	} else if (isConfirmAction(action)) {
		return formatConfirm(action, turnStart);
	} else if (isEliminateAction(action)) {
		const card = hasMysteryHand(player) ? player.hand[action.handIndex] : undefined;
		return formatEliminate(action, card, turnStart);
	} else if (isInvestigateAction(action)) {
		const card = hasMysteryHand(player) ? player.hand[action.handIndex] : undefined;
		return formatInvestigate(action, card, turnStart);
	} else if (isPursueAction(action)) {
		return formatPursue(action, turnStart);
	} else {
		throw new Error(`Unknown action type: ${action.actionType}`);
	}
}
