export enum LeadType {
	Motive = "Motive",
	Opportunity = "Opportunity",
	Suspect = "Suspect",
}

export const LEAD_TYPES: LeadType[] = [
	LeadType.Motive,
	LeadType.Opportunity,
	LeadType.Suspect,
];

export function isLeadType(maybe: unknown): maybe is LeadType {
	return (typeof maybe === "string")
		&& (LEAD_TYPES.indexOf(maybe as LeadType) >= 0);
}
