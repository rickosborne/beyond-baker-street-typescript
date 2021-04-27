import { EVIDENCE_TYPES, EvidenceType } from "./EvidenceType";
import { EVIDENCE_CARD_VALUES, EvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
import { EvidenceValue } from "./EvidenceValue";
import { CardType } from "./CardType";
import { removeIf } from "./removeIf";
import { Pile } from "./Pile";

export interface UnknownCard {
	possibleTypes: EvidenceType[];
	possibleValues: EvidenceValue[];
}

export class MysteryCard implements UnknownCard {
	private readonly possible: EvidenceCard[] = [];

	constructor(
		possibleTypes: EvidenceType[] = EVIDENCE_TYPES,
		possibleValues: EvidenceValue[] = EVIDENCE_CARD_VALUES,
	) {
		const cardType = CardType.Evidence;
		for (const evidenceType of possibleTypes) {
			for (const evidenceValue of possibleValues) {
				this.possible.push({
					cardType,
					evidenceType,
					evidenceValue,
				});
			}
		}
	}

	public asArray(): EvidenceCard[] {
		return this.possible.slice();
	}

	public asEvidence(): EvidenceCard | undefined {
		if (this.possible.length === 1) {
			return this.possible[0];
		}
		return undefined;
	}

	public couldBe(evidenceCard: EvidenceCard): boolean {
		return this.possible.find(card => isSameEvidenceCard(card, evidenceCard)) != null;
	}

	public couldBeType(evidenceType: EvidenceType): boolean {
		return this.possible.find(card => card.evidenceType === evidenceType) != null;
	}

	public couldBeValue(value: EvidenceValue): boolean {
		return this.possible.find(card => card.evidenceValue === value) != null;
	}

	public eliminateCard(evidenceCard: EvidenceCard): void {
		if (!this.isKnown) {
			removeIf(this.possible, card => isSameEvidenceCard(evidenceCard, card));
		}
	}

	public eliminateType(evidenceType: EvidenceType): void {
		removeIf(this.possible, card => card.evidenceType === evidenceType);
	}

	public eliminateValue(value: EvidenceValue): void {
		removeIf(this.possible, card => card.evidenceValue === value);
	}

	public get isKnown(): boolean {
		return this.possible.length === 1;
	}

	public get possibleTypes(): EvidenceType[] {
		const types: EvidenceType[] = [];
		for (const evidenceCard of this.possible) {
			if (!types.includes(evidenceCard.evidenceType)) {
				types.push(evidenceCard.evidenceType);
			}
		}
		return types;
	}

	public get possibleValues(): EvidenceValue[] {
		const values: EvidenceValue[] = [];
		for (const evidenceCard of this.possible) {
			if (!values.includes(evidenceCard.evidenceValue)) {
				values.push(evidenceCard.evidenceValue);
			}
		}
		return values;
	}

	public setType(evidenceType: EvidenceType): void {
		removeIf(this.possible, card => card.evidenceType !== evidenceType);
	}

	public setValue(value: EvidenceValue): void {
		removeIf(this.possible, card => card.evidenceValue !== value);
	}
}

export class MysteryPile extends Pile<EvidenceCard> {
	constructor() {
		super();
		const cardType: CardType.Evidence = CardType.Evidence;
		this.cards.push(...EVIDENCE_TYPES.flatMap(evidenceType => EVIDENCE_CARD_VALUES.map(evidenceValue => ({
			cardType,
			evidenceType,
			evidenceValue,
		}))));
	}

	public eliminate(evidenceCard: EvidenceCard | undefined): void {
		if (evidenceCard != null) {
			removeIf(this.cards, c => isSameEvidenceCard(evidenceCard, c));
		}
	}
}
