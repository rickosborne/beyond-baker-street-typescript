import { LEAD_TYPES, LeadType } from "./LeadType";
import { EvidenceCard } from "./EvidenceCard";
import { LeadCard } from "./LeadCard";
import { CaseFileCard } from "./CaseFileCard";
import { ImpossibleCard } from "./Impossible";

export interface VisibleLead {
	readonly badCards: EvidenceCard[];
	readonly badValue: number;
	readonly confirmed: boolean;
	readonly evidenceCards: EvidenceCard[];
	readonly evidenceValue: number;
	readonly leadCard: LeadCard;
	readonly leadCount: number;
}

export interface VisibleBoard {
	readonly caseFile: CaseFileCard;
	readonly holmesLocation: number;
	readonly impossibleCards: ImpossibleCard[];
	readonly impossibleLimit: number;
	readonly investigationMarker: number;
	readonly leads: Record<LeadType, VisibleLead>;
	readonly remainingEvidenceCount: number;
}

export interface HasVisibleBoard {
	readonly board: VisibleBoard;
}

export function formatLeadProgress(lead: VisibleLead): string {
	return `${lead.leadCard.leadType}-${lead.confirmed ? "confirmed" : `${lead.leadCard.evidenceType}-${lead.evidenceValue}/${lead.leadCard.evidenceTarget}${lead.badValue > 0 ? `+${lead.badValue}` : ""}`}`;
}

export function formatLeadsProgress(board: VisibleBoard): string {
	return `Leads progress: ${LEAD_TYPES.map(leadType => formatLeadProgress(board.leads[leadType])).join(", ")}`;
}

export function leadIsFinished(lead: VisibleLead): boolean {
	return lead.leadCard == null || (lead.evidenceValue === (lead.leadCard.evidenceTarget + lead.badValue));
}

export function leadIsUnfinished(lead: VisibleLead): boolean {
	return !(lead.confirmed || leadIsFinished(lead));
}
