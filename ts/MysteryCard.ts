import { CardType } from "./CardType";
import { EVIDENCE_CARD_VALUES, EvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
import { EVIDENCE_TYPES, EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { Pile } from "./Pile";
import { removeIf } from "./removeIf";
import { UniqueArray } from "./UniqueArray";

export interface UnknownCard {
	possibleCount: number;
	possibleTypes: EvidenceType[];
	possibleValues: EvidenceValue[];
}

export class MysteryCard implements UnknownCard {
	private readonly _possibleTypes = new UniqueArray<EvidenceType>();
	private readonly _possibleValues = new UniqueArray<EvidenceValue>();
	private readonly possible = new UniqueArray<EvidenceCard>(isSameEvidenceCard);

	constructor(
		possibleTypes: EvidenceType[] = EVIDENCE_TYPES,
		possibleValues: EvidenceValue[] = EVIDENCE_CARD_VALUES,
	) {
		const cardType = CardType.Evidence;
		this._possibleTypes.add(...possibleTypes);
		this._possibleValues.add(...possibleValues);
		for (const evidenceType of possibleTypes) {
			for (const evidenceValue of possibleValues) {
				this.possible.add({
					cardType,
					evidenceType,
					evidenceValue,
				});
			}
		}
	}

	private addPossible(...evidenceCards: EvidenceCard[]): void {
		if (this.possible.add(...evidenceCards) > 0) {
			this._possibleValues.clear();
			this._possibleTypes.clear();
		}
	}

	public asArray(): EvidenceCard[] {
		return this.possible.asArray();
	}

	public asEvidence(): EvidenceCard | undefined {
		return this.possible.head;
	}

	public couldBe(evidenceCard: EvidenceCard): boolean {
		return this.possible.includes(evidenceCard);
	}

	public couldBeType(evidenceType: EvidenceType): boolean {
		return this.possibleTypes.includes(evidenceType);
	}

	public couldBeValue(value: EvidenceValue): boolean {
		return this.possibleValues.includes(value);
	}

	public eliminateCard(evidenceCard: EvidenceCard): void {
		if (!this.isKnown) {
			if (this.possible.remove(evidenceCard) > 0) {
				this._possibleTypes.clear();
				this._possibleValues.clear();
			}
		}
	}

	public eliminateType(evidenceType: EvidenceType): void {
		this.possible.removeIf(card => card.evidenceType === evidenceType);
		this._possibleTypes.remove(evidenceType);
	}

	public eliminateValue(value: EvidenceValue): void {
		this.possible.removeIf(card => card.evidenceValue === value);
		this._possibleValues.remove(value);
	}

	public get isKnown(): boolean {
		return this.possible.length === 1;
	}

	public get possibleCount(): number {
		return this.possible.length;
	}

	public get possibleTypes(): EvidenceType[] {
		if (this._possibleTypes.length === 0) {
			this._possibleTypes.add(...this.possible.map(p => p.evidenceType));
		}
		return this._possibleTypes.asArray();
	}

	public get possibleValues(): EvidenceValue[] {
		if (this._possibleValues.length === 0) {
			this._possibleValues.add(...this.possible.map(p => p.evidenceValue));
		}
		return this._possibleValues.asArray();
	}

	public probabilityOf(predicate: (evidenceCard: EvidenceCard) => boolean): number {
		return this.possible.filter(predicate).length / this.possible.length;
	}

	public setType(evidenceType: EvidenceType): void {
		this.possible.removeIf(card => card.evidenceType !== evidenceType);
		this._possibleTypes.clear();
		this._possibleTypes.add(evidenceType);
	}

	public setValue(value: EvidenceValue): void {
		this.possible.removeIf(card => card.evidenceValue !== value);
		this._possibleValues.clear();
		this._possibleValues.add(value);
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
			return "!" + all.filter(t => !possible.includes(t)).join();
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
