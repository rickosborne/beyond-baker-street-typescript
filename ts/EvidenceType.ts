export enum EvidenceType {
	Contact = "Contact",
	Detail = "Detail",
	Document = "Document",
	Track = "Track",
}

export const EVIDENCE_TYPES: EvidenceType[] = [
	EvidenceType.Contact,
	EvidenceType.Detail,
	EvidenceType.Document,
	EvidenceType.Track,
];

export function isEvidenceType(maybe: unknown): maybe is EvidenceType {
	return (typeof maybe === "string")
		&& (EVIDENCE_TYPES.indexOf(maybe as EvidenceType) >= 0);
}
