import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { EvidenceCard } from "./EvidenceCard";
import { LeadCard } from "./LeadCard";
import { Outcome } from "./Outcome";

export interface PursueAction extends Action<ActionType.Pursue> {
	actionType: ActionType.Pursue;
	leadType: LeadType;
}

export interface PursueOutcome extends Outcome {
	impossibleCount: number;
	nextLead: LeadCard;
	returnedEvidence: EvidenceCard[];
}

export function isPursueAction(maybe: unknown): maybe is PursueAction {
	const pa = maybe as PursueAction;
	return isAction(maybe, ActionType.Pursue)
		&& isLeadType(pa.leadType);
}
