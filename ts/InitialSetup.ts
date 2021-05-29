import { CaseFileCard } from "./CaseFileCard";
import { EvidenceCard } from "./EvidenceCard";
import { InspectorType } from "./InspectorType";
import { LeadCard } from "./LeadCard";
import { LeadType } from "./LeadType";

export interface SetupPlayer {
	readonly hand: EvidenceCard[];
	readonly inspector?: InspectorType;
	readonly name: string;
}

export interface InitialSetup {
	readonly caseFile: CaseFileCard;
	readonly leads: Record<LeadType, LeadCard[]>;
	readonly players: SetupPlayer[];
	readonly remaining: EvidenceCard[];
}
