import { EVIDENCE_CARD_VALUES } from "./EvidenceCard";
import { EvidenceValue } from "./EvidenceValue";

export function invertValues(...values: EvidenceValue[]): EvidenceValue[] {
	return EVIDENCE_CARD_VALUES.filter(v => !values.includes(v));
}
