import { EVIDENCE_CARDS, EvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
import { MysteryCard } from "./MysteryCard";
import { UniqueArray } from "./UniqueArray";

export class MysteryPile {
	private readonly cards: UniqueArray<EvidenceCard> = new UniqueArray<EvidenceCard>(isSameEvidenceCard, EVIDENCE_CARDS);

	public add(evidenceCard: EvidenceCard): boolean {
		return this.cards.add(evidenceCard) > 0;
	}

	public couldBe(evidenceCard: EvidenceCard): boolean {
		return this.cards.anyMatch(c => isSameEvidenceCard(c, evidenceCard));
	}

	/**
	 * @returns {number} The number of cards eliminated.
	 */
	public eliminate(evidenceCard: EvidenceCard | undefined): number {
		if (evidenceCard != null) {
			return this.cards.removeIf(c => isSameEvidenceCard(evidenceCard, c));
		}
		return 0;
	}

	public toMysteryCard(): MysteryCard {
		return MysteryCard.fromEvidenceCards(this.cards.asArray());
	}
}
