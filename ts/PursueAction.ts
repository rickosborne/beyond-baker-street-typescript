import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { EvidenceCard } from "./EvidenceCard";
import { LeadCard } from "./LeadCard";

export interface PursueAction extends Action<ActionType.Pursue> {
	actionType: ActionType.Pursue;
	leadType: LeadType;
}

export interface PursueOutcome {
	impossibleCards: EvidenceCard[]
	impossibleFaceDownCount: number;
	nextLead: LeadCard;
}

export function isPursueAction(maybe: unknown): maybe is PursueAction {
	const pa = maybe as PursueAction;
	return isAction(maybe, ActionType.Pursue)
		&& isLeadType(pa.leadType);
}
