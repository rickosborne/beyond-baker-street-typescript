import { EvidenceValue } from "../EvidenceValue";

export function minus(from: EvidenceValue[], subtract: EvidenceValue): EvidenceValue[] {
    return from.filter(v => v !== subtract);
}

export function plus(from: EvidenceValue[], add: EvidenceValue): EvidenceValue[] {
	const copy = from.slice();
	if (!copy.includes(add)) {
		copy.push(add);
	}
	return copy;
}
