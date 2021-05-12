import { EvidenceValue } from "./EvidenceValue";

export function minus(from: EvidenceValue[], subtract: EvidenceValue): EvidenceValue[] {
    return from.filter(v => v !== subtract);
}
