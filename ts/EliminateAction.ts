import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { EvidenceCard, formatEvidence, isEvidenceCard } from "./EvidenceCard";
import { ImpossibleCard } from "./Impossible";
import { formatMysteryCard, MysteryCard } from "./MysteryCard";
import { Outcome, OutcomeType } from "./Outcome";
import { TurnStart } from "./TurnStart";
import { VisibleBoard } from "./VisibleBoard";

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

export function formatEliminate(eliminate: EliminateAction, card: MysteryCard | EvidenceCard | undefined, turnStart: TurnStart): string {
	return `${turnStart.player.name} eliminates ${card == null ? "mystery evidence" : isEvidenceCard(card) ? formatEvidence(card) : formatMysteryCard(card)}.  Impossible count is ${turnStart.board.impossibleCards.length}/${turnStart.board.caseFile.impossibleCount}.  Investigation marker is at ${turnStart.board.investigationMarker}.`;
}

export function formatEliminateOutcome(outcome: EliminateOutcome, board: VisibleBoard): string {
	return `${outcome.activePlayer.name} eliminated ${formatEvidence(outcome.evidenceCard)}.  Impossible count is ${outcome.impossibleCards.length}/${board.caseFile.impossibleCount}.  Investigation is at ${outcome.investigationMarker}.`;
}
