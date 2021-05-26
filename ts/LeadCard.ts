import { LEAD_PILE_START_COUNT } from "./Board";
import { Card, isCardOfType } from "./Card";
import { CardType } from "./CardType";
import { EVIDENCE_TYPES, EvidenceType, isEvidenceType } from "./EvidenceType";
import { EvidenceValue, isEvidenceValue } from "./EvidenceValue";
import { groupBy } from "./util/groupBy";
import { isLeadType, LeadType } from "./LeadType";
import { randomItems } from "./util/randomItems";
import { range } from "./util/range";
import { PseudoRNG } from "./rng";

export interface LeadCard extends Card<CardType.Lead> {
	cardType: CardType.Lead;
	evidenceTarget: number;
	evidenceType: EvidenceType;
	leadType: LeadType;
}

export const LEAD_CARD_TARGET_MIN = 7;
export const LEAD_CARD_TARGET_MAX = 13;
export const LEAD_TYPE_FOR_TARGET: Record<number, LeadType> = {
	10: LeadType.Motive,
	11: LeadType.Suspect,
	12: LeadType.Suspect,
	13: LeadType.Suspect,
	7: LeadType.Opportunity,
	8: LeadType.Opportunity,
	9: LeadType.Motive,
};

export function isLeadCard(maybe: unknown): maybe is LeadCard {
	const lc = maybe as LeadCard;
	return isCardOfType<CardType.Lead>(maybe, CardType.Lead)
		&& isLeadType(lc.leadType)
		&& isEvidenceType(lc.evidenceType)
		&& isEvidenceValue(lc.evidenceTarget);
}

export function leadCard(leadType: LeadType, evidenceType: EvidenceType, evidenceTarget: number): LeadCard {
	return {
		cardType: CardType.Lead,
		evidenceTarget,
		evidenceType,
		leadType,
	};
}

export const LEAD_CARDS: LeadCard[] = range(LEAD_CARD_TARGET_MIN, LEAD_CARD_TARGET_MAX)
	.flatMap(evidenceTarget => EVIDENCE_TYPES.map(evidenceType => ({
		cardType: CardType.Lead,
		evidenceTarget,
		evidenceType,
		leadType: LEAD_TYPE_FOR_TARGET[evidenceTarget],
	})));

export const LEAD_CARDS_BY_LEADTYPE: Record<LeadType, LeadCard[]> = groupBy(LEAD_CARDS, c => c.leadType);

export function randomLeadCards(leadType: LeadType, prng: PseudoRNG): LeadCard[] {
	return randomItems(LEAD_CARDS_BY_LEADTYPE[leadType], LEAD_PILE_START_COUNT, prng);
}

export interface LeadReverseCard extends Card<CardType.LeadReverse> {
	cardType: CardType.LeadReverse;
}

export function isLeadReverseCard(maybe: unknown): maybe is LeadReverseCard {
	return isCardOfType<CardType.LeadReverse>(maybe, CardType.LeadReverse);
}

export function formatLeadCard(leadCard: LeadCard): string {
	return `${leadCard.leadType}-${leadCard.evidenceType}-${leadCard.evidenceTarget}`;
}
