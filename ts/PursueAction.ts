import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { EvidenceCard } from "./EvidenceCard";
import { formatLeadCard, LeadCard } from "./LeadCard";
import { Outcome, OutcomeType } from "./Outcome";
import { TurnStart } from "./TurnStart";
import { Player } from "./Player";

export interface PursueAction extends Action {
	actionType: ActionType.Pursue;
	leadType: LeadType;
}

export interface PursueOutcome extends Outcome {
	action: PursueAction;
	impossibleCount: number;
	nextLead: LeadCard | undefined;
	outcomeType: OutcomeType.Pursue;
	returnedEvidence: EvidenceCard[];
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

export function formatPursue(action: PursueAction, turnStart: TurnStart): string {
	return `${turnStart.player.name} pursues ${formatLeadCard(turnStart.board.leads[action.leadType].leadCard)}.  Impossible count is ${turnStart.board.impossibleCards.length}.`;
}

export function formatPursueOutcome(outcome: PursueOutcome): string {
	return `${outcome.activePlayer.name} pursued ${outcome.action.leadType}.  ${outcome.returnedEvidence.length} evidence were returned.  ${outcome.impossibleCount} impossible have been found.  ${outcome.nextLead == null ? `No leads remain!` : `Next lead is ${formatLeadCard(outcome.nextLead)}.`}`;
}
