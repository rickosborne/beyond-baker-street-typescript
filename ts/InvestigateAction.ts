import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { EvidenceCard } from "./EvidenceCard";
import { LeadCard } from "./LeadCard";
import { Outcome } from "./Outcome";

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
	/**
	 * Incorrect evidence type.
	 */
	Bad = "Bad",
	/**
	 * Correct evidence type, but over target.
	 */
	DeadLead = "DeadLead",
	/**
	 * Evidence type matches AND value does not go over.
	 */
	Good = "Good",
}

export interface InvestigateOutcome<IO extends InvestigateOutcomeType> extends Outcome {
	evidenceCard: EvidenceCard;
	investigateOutcomeType: IO;
}

export interface GoodInvestigateOutcome extends InvestigateOutcome<InvestigateOutcomeType.Good> {
	accumulatedValue: number;
	badValue: number;
	investigateOutcomeType: InvestigateOutcomeType.Good;
	targetValue: number;
	totalValue: number;
}

export interface DeadLeadInvestigateOutcome extends InvestigateOutcome<InvestigateOutcomeType.DeadLead> {
	impossibleCount: number;
	nextLead: LeadCard | undefined;
	returnedEvidence: EvidenceCard[];
}

export interface BadInvestigateOutcome extends InvestigateOutcome<InvestigateOutcomeType.Bad> {
	badValue: number;
	targetValue: number;
	totalValue: number;
}
