import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { EvidenceCard } from "./EvidenceCard";
import { LeadCard } from "./LeadCard";

export interface InvestigateAction extends Action<ActionType.Investigate> {
	handIndex: number;
	leadType: LeadType;
}

export function isInvestigateAction(maybe: unknown): maybe is InvestigateAction {
	const ia = maybe as InvestigateAction;
	// noinspection SuspiciousTypeOfGuard
	return isAction(maybe, ActionType.Investigate)
		&& (typeof ia.handIndex === "number")
		&& isLeadType(ia.leadType);
}

export enum InvestigateOutcomeType {
	Bad = "Bad",
	DeadLead = "DeadLead",
	Good = "Good",
}

export interface InvestigateOutcome<IO extends InvestigateOutcomeType> {
	evidenceCard: EvidenceCard;
	investigateOutcomeType: IO;
}

export interface GoodInvestigateOutcome extends InvestigateOutcome<InvestigateOutcomeType.Good> {
	accumulatedValue: number;
	investigateOutcomeType: InvestigateOutcomeType.Good;
	targetValue: number;
}

export interface DeadLeadInvestigateOutcome extends InvestigateOutcome<InvestigateOutcomeType.DeadLead> {
	impossibleCount: number;
	nextLead: LeadCard;
}

export interface BadInvestigateOutcome extends InvestigateOutcome<InvestigateOutcomeType.Bad> {
	badCount: number;
	badValue: number;
	targetValue: number;
}
