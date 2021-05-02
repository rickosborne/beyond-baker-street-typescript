import { CardType } from "./CardType";
import { EVIDENCE_CARD_VALUES, EVIDENCE_CARDS, EvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
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

type ValueFlags = [ boolean, boolean, boolean, boolean, boolean, boolean, boolean ];
const ALL_FALSE_VALUE_FLAGS: ValueFlags = [ false, false, false, false, false, false, false ];

export class MysteryCard implements UnknownCard {
	private _evidence: EvidenceCard | undefined;
	private readonly possible: Record<EvidenceType, ValueFlags> = {
		[EvidenceType.Contact]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
		[EvidenceType.Detail]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
		[EvidenceType.Document]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
		[EvidenceType.Track]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
	};
	public possibleCount = 0;
	private readonly typeCounts: Record<EvidenceType, number> = {
		[EvidenceType.Contact]: 0,
		[EvidenceType.Detail]: 0,
		[EvidenceType.Document]: 0,
		[EvidenceType.Track]: 0,
	};
	private readonly uniqueTypes = new UniqueArray<EvidenceType>();
	private readonly uniqueValues = new UniqueArray<number>();
	private readonly valueCounts: Record<EvidenceValue, number> = {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
		6: 0,
	};

	constructor(
		possibleTypes: EvidenceType[] = EVIDENCE_TYPES,
		possibleValues: EvidenceValue[] = EVIDENCE_CARD_VALUES,
	) {
		const cardType = CardType.Evidence;
		for (const evidenceValue of possibleValues) {
			for (const evidenceType of possibleTypes) {
				this.addPossible(<EvidenceCard> {
					cardType,
					evidenceType,
					evidenceValue,
				});
			}
		}
	}

	private addPossible(...evidenceCards: EvidenceCard[]): void {
		for (const evidenceCard of evidenceCards) {
			const evidenceType = evidenceCard.evidenceType;
			const evidenceValue = evidenceCard.evidenceValue;
			const existing = this.possible[evidenceType][evidenceValue];
			if (!existing) {
				this.possible[evidenceType][evidenceValue] = true;
				this.possibleCount++;
				this.uniqueTypes.add(evidenceType);
				this.typeCounts[evidenceType]++;
				this.uniqueValues.add(evidenceValue);
				this.valueCounts[evidenceValue]++;
				this._evidence = this.possibleCount === 1 ? {
					cardType: CardType.Evidence,
					evidenceType,
					evidenceValue,
				} : undefined;
			}
		}
	}

	private asArray(): EvidenceCard[] {
		if (this._evidence != null) {
			return [this._evidence];
		}
		return EVIDENCE_CARDS.filter(c => this.couldBe(c));
	}

	public asEvidence(): EvidenceCard | undefined {
		return this._evidence;
	}

	public couldBe(evidenceCard: EvidenceCard): boolean {
		return this.possible[evidenceCard.evidenceType][evidenceCard.evidenceValue];
	}

	public couldBeType(evidenceType: EvidenceType): boolean {
		return this.typeCounts[evidenceType] > 0;
	}

	public couldBeValue(value: EvidenceValue): boolean {
		return this.valueCounts[value] > 0;
	}

	public eliminateCard(evidenceCard: EvidenceCard): void {
		if (this.possibleCount > 1) {
			const evidenceType = evidenceCard.evidenceType;
			const evidenceValue = evidenceCard.evidenceValue;
			this.eliminateTypeAndValue(evidenceType, evidenceValue);
		}
	}

	public eliminateType(evidenceType: EvidenceType): void {
		for (const evidenceValue of EVIDENCE_CARD_VALUES) {
			this.eliminateTypeAndValue(evidenceType, evidenceValue);
		}
	}

	private eliminateTypeAndValue(evidenceType: EvidenceType, evidenceValue: EvidenceValue): void {
		const existing = this.possible[evidenceType][evidenceValue];
		if (existing) {
			this.possible[evidenceType][evidenceValue] = false;
			this.typeCounts[evidenceType]--;
			if (this.typeCounts[evidenceType] === 0) {
				this.uniqueTypes.remove(evidenceType);
			}
			this.valueCounts[evidenceValue]--;
			if (this.valueCounts[evidenceValue] === 0) {
				this.uniqueValues.remove(evidenceValue);
			}
			this.possibleCount--;
			if (this.possibleCount === 1) {
				this._evidence = {
					cardType: CardType.Evidence,
					evidenceType: this.uniqueTypes.head as EvidenceType,
					evidenceValue: this.uniqueValues.head as EvidenceValue,
				};
			} else if (this.possibleCount === 0) {
				throw new Error("Eliminated all possibilities");
			}
		}
	}

	public eliminateValue(evidenceValue: EvidenceValue): void {
		for (const evidenceType of EVIDENCE_TYPES) {
			this.eliminateTypeAndValue(evidenceType, evidenceValue);
		}
	}

	public get isKnown(): boolean {
		return this.possibleCount === 1;
	}

	public get possibleTypes(): EvidenceType[] {
		return this.uniqueTypes.asArray();
	}

	public get possibleValues(): EvidenceValue[] {
		return this.uniqueValues.asArray();
	}

	public probabilityOf(predicate: (evidenceCard: EvidenceCard) => boolean): number {
		return this.asArray().filter(predicate).length / this.possibleCount;
	}

	public setType(evidenceType: EvidenceType): void {
		for (const et of EVIDENCE_TYPES) {
			if (et === evidenceType) {
				continue;
			}
			for (const evidenceValue of EVIDENCE_CARD_VALUES) {
				this.eliminateTypeAndValue(et, evidenceValue);
			}
		}
	}

	public setValue(value: EvidenceValue): void {
		for (const evidenceValue of EVIDENCE_CARD_VALUES) {
			if (evidenceValue === value) {
				continue;
			}
			for (const evidenceType of EVIDENCE_TYPES) {
				this.eliminateTypeAndValue(evidenceType, evidenceValue);
			}
		}
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
		} else {			return possible.join("|");
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
