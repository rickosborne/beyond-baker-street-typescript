import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { EvidenceCard } from "./EvidenceCard";
import { formatLeadCard, LeadCard } from "./LeadCard";
import { isLeadType, LeadType } from "./LeadType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player } from "./Player";
import { VisibleBoard } from "./VisibleBoard";

export interface PursueAction extends Action {
	readonly actionType: ActionType.Pursue;
	readonly leadType: LeadType;
}

export interface PursueOutcome extends Outcome {
	readonly action: PursueAction;
	readonly impossibleCount: number;
	readonly nextLead: LeadCard | undefined;
	readonly outcomeType: OutcomeType.Pursue;
	readonly returnedEvidence: EvidenceCard[];
}

export function isPursueAction(maybe: unknown): maybe is PursueAction {
	const pa = maybe as PursueAction;
	return isActionOfType(maybe, ActionType.Pursue)
		&& isLeadType(pa.leadType);
}

export function isPursueOutcome(maybe: unknown): maybe is PursueOutcome {
	const o = maybe as PursueOutcome;
	return (o != null) && (o.outcomeType === OutcomeType.Pursue);
}

export function formatPursue(action: PursueAction, player: Player, board: VisibleBoard): string {
	return `${player.name} pursues ${formatLeadCard(board.leads[action.leadType].leadCard)}.  Impossible count is ${board.impossibleCards.length}/${board.impossibleLimit}.`;
}

export function formatPursueOutcome(outcome: PursueOutcome, board: VisibleBoard): string {
	return `${outcome.activePlayer.name} pursued ${outcome.action.leadType}.  ${outcome.returnedEvidence.length} evidence were returned.  ${outcome.impossibleCount}/${board.impossibleLimit} impossible have been found.  ${outcome.nextLead == null ? `No leads remain!` : `Next lead is ${formatLeadCard(outcome.nextLead)}.`}`;
}
