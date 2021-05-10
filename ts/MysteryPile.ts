import { EVIDENCE_CARDS, EvidenceCard, formatEvidence, isSameEvidenceCard } from "./EvidenceCard";
import { MysteryCard } from "./MysteryCard";
import { UniqueArray } from "./UniqueArray";

export class MysteryPile {
	// noinspection JSMismatchedCollectionQueryUpdate
	private readonly _log: string[] = [];
	private readonly cards: UniqueArray<EvidenceCard> = new UniqueArray<EvidenceCard>(isSameEvidenceCard, EVIDENCE_CARDS);

	constructor() {
		this.log(`created with ${this.cards.length} cards`);
	}

	public add(evidenceCard: EvidenceCard): boolean {
		const didAdd = this.cards.add(evidenceCard) > 0;
		if (didAdd) {
			this.log(`add ${formatEvidence(evidenceCard)}: ${this.cards.length}`);
		}
		return didAdd;
	}

	public couldBe(evidenceCard: EvidenceCard): boolean {
		return this.cards.anyMatch(c => isSameEvidenceCard(c, evidenceCard));
	}

	public eliminate(evidenceCard: EvidenceCard | undefined, context: string): void {
		if (evidenceCard != null) {
			const removed = this.cards.removeIf(c => isSameEvidenceCard(evidenceCard, c));
			if (removed > 0) {
				this.log(`eliminate ${formatEvidence(evidenceCard)} ${this.cards.length}: ${context}`);
			}
		}
	}

	private log(message: string): void {
		this._log.push(message);
	}

	public toMysteryCard(): MysteryCard {
		return MysteryCard.fromEvidenceCards(this.cards.asArray());
	}
}
