export enum EvidenceType {
	Clue = "Clue",
	Document = "Document",
	Track = "Track",
	Witness = "Witness",
}

export const EVIDENCE_TYPES: EvidenceType[] = [
	EvidenceType.Clue,
	EvidenceType.Document,
	EvidenceType.Track,
	EvidenceType.Witness,
];

export function isEvidenceType(maybe: unknown): maybe is EvidenceType {
	return (typeof maybe === "string")
		&& (EVIDENCE_TYPES.indexOf(maybe as EvidenceType) >= 0);
}
