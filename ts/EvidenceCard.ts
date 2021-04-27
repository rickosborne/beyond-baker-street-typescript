import { Card, isCardOfType } from "./Card";
import { CardType } from "./CardType";
import { EVIDENCE_TYPES, EvidenceType, isEvidenceType } from "./EvidenceType";
import { isEvidenceValue } from "./EvidenceValue";
import { range } from "./range";

export interface EvidenceCard extends Card<CardType.Evidence> {
	cardType: CardType.Evidence;
	evidenceType: EvidenceType;
	evidenceValue: number;
}

export const EVIDENCE_CARD_VALUE_MIN = 1;
export const EVIDENCE_CARD_VALUE_MAX = 6;
export const EVIDENCE_CARD_VALUES = range(EVIDENCE_CARD_VALUE_MIN, EVIDENCE_CARD_VALUE_MAX);

export function isEvidenceCard(maybe: unknown): maybe is EvidenceCard {
	const ec = maybe as EvidenceCard;
	return isCardOfType<CardType.Evidence>(maybe, CardType.Evidence)
		&& isEvidenceType(ec.evidenceType)
		&& isEvidenceValue(ec.evidenceValue);
}

export function isSameEvidenceCard(a: EvidenceCard, b: EvidenceCard): boolean {
	return (a === b) || (a.evidenceType === b.evidenceType && a.evidenceValue === b.evidenceValue);
}

export const EVIDENCE_CARDS: EvidenceCard[] = EVIDENCE_CARD_VALUES
	.flatMap(evidenceValue => EVIDENCE_TYPES.map(evidenceType => ({
		cardType: CardType.Evidence,
		evidenceType,
		evidenceValue,
	})));

export function formatEvidence(evidence: EvidenceCard): string {
	return `${evidence.evidenceType}-${evidence.evidenceValue}`;
}
