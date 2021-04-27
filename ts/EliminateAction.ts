import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { Outcome, OutcomeType } from "./Outcome";
import { ImpossibleCard } from "./Impossible";
import { EvidenceCard, formatEvidence } from "./EvidenceCard";
import { Player } from "./Player";
import { TurnStart } from "./TurnStart";

export interface EliminateAction extends Action {
	actionType: ActionType.Eliminate;
	handIndex: number;
}

export interface EliminateOutcome extends Outcome {
	action: EliminateAction;
	evidenceCard: EvidenceCard;
	impossibleCards: ImpossibleCard[];
	impossibleFaceDownCount: number;
	investigationMarker: number;
	outcomeType: OutcomeType.Eliminate;
}

export function isEliminateAction(maybe: unknown): maybe is EliminateAction {
	const ea = maybe as EliminateAction;
	// noinspection SuspiciousTypeOfGuard
	return isActionOfType(maybe, ActionType.Eliminate)
		&& (typeof ea.handIndex === "number");
}

export function isEliminateOutcome(maybe: unknown): maybe is EliminateOutcome {
	const o = maybe as EliminateOutcome;
	return (o != null) && (o.outcomeType === OutcomeType.Eliminate);
}

export function formatEliminate(eliminate: EliminateAction, evidenceCard: EvidenceCard | undefined, turnStart: TurnStart): string {
	return `${turnStart.player.name} eliminates ${evidenceCard == null ? "mystery evidence" : formatEvidence(evidenceCard)}.  Impossible count is ${turnStart.board.impossibleCards.length}.`;
}

export function formatEliminateOutcome(outcome: EliminateOutcome): string {
	return `${outcome.activePlayer.name} eliminated ${formatEvidence(outcome.evidenceCard)}.  Impossible count is ${outcome.impossibleCards.length}.  Investigation is at ${outcome.investigationMarker}.`;
}
