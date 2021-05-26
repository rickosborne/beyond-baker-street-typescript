import { Action, TypedAction } from "../Action";
import { ActionType } from "../ActionType";
import { formatAdlerAction, isAdlerAction } from "../inspector/Adler";
import { formatAssist, isAssistAction } from "../AssistAction";
import { formatBaskervilleAction, isBaskervilleAction } from "../inspector/Baskerville";
import { formatConfirm, isConfirmAction } from "../ConfirmAction";
import { formatEliminate, isEliminateAction } from "../EliminateAction";
import { TriFunction } from "../Function";
import { Guard } from "../Guard";
import { formatHopeAction, isHopeAction } from "../inspector/Hope";
import { formatHudsonAction, isHudsonAction } from "../inspector/Hudson";
import { formatInvestigate, isInvestigateAction } from "../InvestigateAction";
import { hasMysteryHand } from "../MysteryCard";
import { formatPikeAction, isPikeAction } from "../inspector/Pike";
import { Player } from "../Player";
import { formatPursue, isPursueAction } from "../PursueAction";
import { formatTobyAction, isTobyAction } from "../inspector/Toby";
import { TurnStart } from "../TurnStart";
import { HasVisibleBoard } from "../VisibleBoard";

function buildActionHandler<T extends ActionType, A extends TypedAction<T>>(
	guard: Guard<A>,
	func: TriFunction<A, Player, HasVisibleBoard, string>
): TriFunction<Action, Player, HasVisibleBoard, string | undefined> {
	return (action: Action, player: Player, hasVisibleBoard: HasVisibleBoard) => {
		if (guard(action)) {
			return func(action, player, hasVisibleBoard);
		}
		return undefined;
	};
}

const actionHandlers: Record<ActionType, TriFunction<Action, Player, HasVisibleBoard, string | undefined>> = {
	[ActionType.Adler]: buildActionHandler(isAdlerAction, (a, p, h) => formatAdlerAction(a, p, h.board.holmesLocation)),
	[ActionType.Assist]: buildActionHandler(isAssistAction, (a, p, h) => formatAssist(a, p, h.board.holmesLocation)),
	[ActionType.Baskerville]: buildActionHandler(isBaskervilleAction, (a, p, h) => formatBaskervilleAction(a, p, h.board.investigationMarker)),
	[ActionType.Confirm]: buildActionHandler(isConfirmAction, (a, p, h) => formatConfirm(a, p, h.board.holmesLocation)),
	[ActionType.Eliminate]: buildActionHandler(isEliminateAction, (a, p, h) => {
		const card = hasMysteryHand(p) ? p.hand[a.handIndex] : undefined;
		return formatEliminate(a, p, h.board, card);
	}),
	[ActionType.Hope]: buildActionHandler(isHopeAction, (a, p, h) => formatHopeAction(a, p, h.board.holmesLocation)),
	[ActionType.Hudson]: buildActionHandler(isHudsonAction, (a, p, h) => formatHudsonAction(a, p, h.board.investigationMarker)),
	[ActionType.Investigate]: buildActionHandler(isInvestigateAction, (a, p, h) => {
		const card = hasMysteryHand(p) ? p.hand[a.handIndex] : undefined;
		return formatInvestigate(a, p, h.board, card);
	}),
	[ActionType.Pike]: buildActionHandler(isPikeAction, (a, p) => formatPikeAction(a, p)),
	[ActionType.Pursue]: buildActionHandler(isPursueAction, (a, p, h) => formatPursue(a, p, h.board)),
	[ActionType.Toby]: buildActionHandler(isTobyAction, (a, p, h) => formatTobyAction(a, p, h.board.remainingEvidenceCount)),
};

export function formatAction(action: Action, player: Player, turnStart: TurnStart): string {
	const handler = actionHandlers[action.actionType];
	if (handler == null) {
		throw new Error(`Unhandled action type ${action.actionType}`);
	}
	const formatted = handler(action, player, turnStart);
	if (formatted == null) {
		throw new Error(`Broken formatter for action type ${action.actionType}`);
	}
	return formatted;
}
