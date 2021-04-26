import { LeadType } from "./LeadType";
import { EvidenceCard } from "./EvidenceCard";
import { LeadCard } from "./LeadCard";
import { CaseFileCard } from "./CaseFileCard";

export interface VisibleLead {
	readonly badCards: EvidenceCard[];
	readonly badValue: number;
	readonly confirmed: boolean;
	readonly evidenceCards: EvidenceCard[];
	readonly evidenceValue: number;
	readonly leadCard: LeadCard;
}

export interface VisibleBoard {
	readonly caseFile: CaseFileCard;
	readonly holmesLocation: number;
	readonly impossibleCount: number;
	readonly investigationMarker: number;
	readonly leads: Record<LeadType, VisibleLead>;
	readonly remainingEvidenceCount: number;
}
