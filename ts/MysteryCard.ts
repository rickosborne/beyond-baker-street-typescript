import { EVIDENCE_TYPES, EvidenceType } from "./EvidenceType";
import { EVIDENCE_CARD_VALUES, EvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
import { EvidenceValue } from "./EvidenceValue";
import { CardType } from "./CardType";
import { removeIf } from "./removeIf";
import { Pile } from "./Pile";

export interface UnknownCard {
	possibleCount: number;
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

	private addPossible(...evidenceCards: EvidenceCard[]): void {
		evidenceCards.filter(card => this.possible.findIndex(p => isSameEvidenceCard(card, p)) < 0)
			.forEach(card => this.possible.push(card));
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

	public get possibleCount(): number {
		return this.possible.length;
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

	public probabilityOf(predicate: (evidenceCard: EvidenceCard) => boolean): number {
		return this.possible.filter(predicate).length / this.possible.length;
	}

	public setType(evidenceType: EvidenceType): void {
		removeIf(this.possible, card => card.evidenceType !== evidenceType);
	}

	public setValue(value: EvidenceValue): void {
		removeIf(this.possible, card => card.evidenceValue !== value);
	}

	// noinspection JSUnusedGlobalSymbols
	public toJSON(): Record<string, unknown> {
		return {
			possibleCount: this.possibleCount,
		};
	}

	public static fromEvidenceCard(evidenceCard: EvidenceCard): MysteryCard {
		return new MysteryCard([evidenceCard.evidenceType], [evidenceCard.evidenceValue]);
	}

	public static fromEvidenceCards(cards: EvidenceCard[]): MysteryCard {
		const mysteryCard = new MysteryCard([], []);
		mysteryCard.addPossible(...cards);
		return mysteryCard;
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

	public toMysteryCard(): MysteryCard {
		return MysteryCard.fromEvidenceCards(this.cards);
	}
}

export function formatMysteryCard(mysteryCard: MysteryCard): string {
	function formatPart<T>(possible: T[], all: T[]): string {
		if (possible.length === all.length) {
			return "*";
		} else if (possible.length === all.length - 1) {
			return  "!" + all.filter(t => !possible.includes(t)).join();
		} else {
			return possible.join("|");
		}
	}
	return `${formatPart(mysteryCard.possibleTypes, EVIDENCE_TYPES)}-${formatPart(mysteryCard.possibleValues, EVIDENCE_CARD_VALUES)}`;
}

export interface HasMysteryHand {
	hand: MysteryCard[];
}

export function hasMysteryHand(maybe: unknown): maybe is HasMysteryHand {
	// noinspection SuspiciousTypeOfGuard
	return (maybe != null)
		&& (Array.isArray((maybe as HasMysteryHand).hand))
		&& ((maybe as HasMysteryHand).hand.findIndex(card => !(card instanceof MysteryCard)) < 0);
}
