export type EvidenceValue = number;

export function isEvidenceValue(maybe: unknown): maybe is EvidenceValue {
	return (typeof maybe === "number")
		&& (maybe >= 1);
}
