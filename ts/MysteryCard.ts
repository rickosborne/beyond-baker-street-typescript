import { CardType } from "./CardType";
import { EVIDENCE_CARD_VALUES, EVIDENCE_CARDS, EvidenceCard, formatEvidence } from "./EvidenceCard";
import { EVIDENCE_TYPES, EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { UniqueArray } from "./UniqueArray";

export interface UnknownCard {
	possibleCount: number;
	possibleTypes: EvidenceType[];
	possibleValues: EvidenceValue[];
}

type ValueFlags = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
const ALL_FALSE_VALUE_FLAGS: ValueFlags = [ false, false, false, false, false, false, false ];

export class MysteryCard implements UnknownCard {
	private _evidence: EvidenceCard | undefined;
	private readonly possible: Record<EvidenceType, ValueFlags> = {
		[EvidenceType.Witness]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
		[EvidenceType.Clue]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
		[EvidenceType.Document]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
		[EvidenceType.Track]: ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags,
	};
	public possibleCount = 0;
	private readonly typeCounts: Record<EvidenceType, number> = {
		[EvidenceType.Witness]: 0,
		[EvidenceType.Clue]: 0,
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
				this.addPossible(<EvidenceCard>{
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

	public asUnknown(): UnknownCard {
		return {
			possibleCount: this.possibleCount,
			possibleTypes: this.possibleTypes,
			possibleValues: this.possibleValues,
		};
	}

	private clear(): void {
		this._evidence = undefined;
		EVIDENCE_TYPES.forEach(et => {
			this.possible[et] = ALL_FALSE_VALUE_FLAGS.slice() as ValueFlags;
			this.typeCounts[et] = 0;
		});
		this.possibleCount = 0;
		this.uniqueTypes.clear();
		this.uniqueValues.clear();
		EVIDENCE_CARD_VALUES.forEach(v => this.valueCounts[v] = 0);
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

	private eliminateTypeAndValue(evidenceType: EvidenceType, evidenceValue: EvidenceValue): boolean {
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
			return true;
		}
		return false;
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

	public setExact(evidenceCard: EvidenceCard): void {
		const formatBefore = formatMysteryCard(this);
		if (!this.couldBe(evidenceCard)) {
			throw new Error(`Mystery card ${formatBefore} cannot set exact ${formatEvidence(evidenceCard)}`);
		}
		const { evidenceType, evidenceValue } = evidenceCard;
		this.clear();
		this._evidence = evidenceCard;
		this.possible[evidenceType][evidenceValue] = true;
		this.typeCounts[evidenceType] = 1;
		this.possibleCount = 1;
		this.uniqueTypes.add(evidenceType);
		this.uniqueValues.add(evidenceValue);
		this.valueCounts[evidenceValue] = 1;
	}

	public setType(evidenceType: EvidenceType): void {
		if (!this.couldBeType(evidenceType)) {
			throw new Error(`Mystery card ${formatMysteryCard(this)} cannot set type ${evidenceType}`);
		}
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
		if (!this.couldBeValue(value)) {
			throw new Error(`Mystery card ${formatMysteryCard(this)} cannot set value ${value}`);
		}
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

function formatPart<T>(possible: T[], all: T[]): string {
	if (possible.length === all.length) {
		return "*";
	} else if (possible.length === all.length - 1) {
		return "!" + all.filter(t => !possible.includes(t)).join();
	} else {
		return possible.join("|");
	}
}

export function formatMysteryCard(mysteryCard: MysteryCard): string {
	return formatUnknownCard(mysteryCard);
}

export function formatUnknownCard(card: UnknownCard): string {
	return `${formatPart(card.possibleTypes, EVIDENCE_TYPES)}-${formatPart(card.possibleValues, EVIDENCE_CARD_VALUES)}`;
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
