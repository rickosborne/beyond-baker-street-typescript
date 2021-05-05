import { expect } from "chai";
import { describe, it } from "mocha";
import { CardType } from "./CardType";
import { EVIDENCE_CARD_VALUES, EVIDENCE_CARDS, EvidenceCard } from "./EvidenceCard";
import { EVIDENCE_TYPES, EvidenceType } from "./EvidenceType";
import { formatMysteryCard, MysteryCard } from "./MysteryCard";
import { randomItem } from "./randomItem";

function expectSingleCard(card: MysteryCard, evidenceType: EvidenceType, evidenceValue: number): void {
	expect(card.possibleCount).equals(1);
	expect(card.isKnown).is.true;
	expect(card.asEvidence()).deep.equals(<EvidenceCard>{
		cardType: CardType.Evidence,
		evidenceType,
		evidenceValue,
	});
	expect(card.probabilityOf(c => c.evidenceValue === evidenceValue && c.evidenceType === evidenceType)).equals(1);
	expect(JSON.parse(JSON.stringify(card))).deep.equals({
		possibleCount: 1,
	});
	expect(formatMysteryCard(card)).equals(`${evidenceType}-${evidenceValue}`);
}

describe("MysteryCard", function () {
	it("defaults to being full", function () {
		const card = new MysteryCard();
		expect(formatMysteryCard(card)).equals("*-*");
		expect(card.possibleCount).equals(24);
		expect(card.isKnown).is.false;
		expect(JSON.parse(JSON.stringify(card))).deep.equals({
			possibleCount: 24,
		});
	});

	it("eliminates types", function () {
		const card = new MysteryCard();
		card.eliminateType(EvidenceType.Track);
		expect(formatMysteryCard(card)).equals("!Track-*");
		expect(card.possibleCount).equals(18);
		expect(card.couldBeType(EvidenceType.Track)).is.false;
		expect(card.couldBeType(EvidenceType.Contact)).is.true;
		expect(card.couldBeType(EvidenceType.Detail)).is.true;
		expect(card.couldBeType(EvidenceType.Document)).is.true;
		expect(card.possibleTypes).deep.equals([ EvidenceType.Contact, EvidenceType.Detail, EvidenceType.Document ]);
		expect(card.possibleValues).deep.equals(EVIDENCE_CARD_VALUES);
		expect(card.isKnown).is.false;
		expect(card.probabilityOf(c => c.evidenceType === EvidenceType.Track)).equals(0);
		expect(card.probabilityOf(c => c.evidenceType === EvidenceType.Contact)).equals(1/3);
		expect(JSON.parse(JSON.stringify(card))).deep.equals({
			possibleCount: 18,
		});
	});

	it("throws if you end up empty", function () {
		const card = new MysteryCard();
		card.eliminateType(EvidenceType.Contact);
		expect(formatMysteryCard(card)).equals("!Contact-*");
		card.eliminateType(EvidenceType.Detail);
		expect(formatMysteryCard(card)).equals("Document|Track-*");
		card.eliminateType(EvidenceType.Document);
		expect(() => {
			card.eliminateType(EvidenceType.Track);
		}).throws("Eliminated all possibilities");
	});

	it("eliminates values", function () {
		const card = new MysteryCard();
		card.eliminateValue(5);
		expect(card.possibleCount).equals(20);
		expect(card.couldBeValue(5)).is.false;
		expect(card.couldBeValue(1)).is.true;
		expect(card.couldBeValue(2)).is.true;
		expect(card.couldBeValue(3)).is.true;
		expect(card.couldBeValue(4)).is.true;
		expect(card.couldBeValue(6)).is.true;
		expect(card.possibleTypes).deep.equals(EVIDENCE_TYPES);
		expect(card.possibleValues).deep.equals([ 1, 2, 3, 4, 6 ]);
		expect(card.isKnown).is.false;
	});

	it("eliminates cards", function () {
		const card = new MysteryCard();
		expect(card.possibleCount).equals(24);
		const evidenceCard = randomItem(EVIDENCE_CARDS);
		card.eliminateCard(evidenceCard);
		expect(card.possibleCount).equals(23);
		EVIDENCE_TYPES.forEach(et => expect(card.couldBeType(et)).is.true);
		EVIDENCE_CARD_VALUES.forEach(v => expect(card.couldBeValue(v)).is.true);
		expect(card.couldBe(evidenceCard)).is.false;
		expect(card.isKnown).is.false;
	});

	it("can get down to 1 via eliminate", function () {
		const card = new MysteryCard();
		expect(card.possibleCount).equals(24);
		expect(card.isKnown).is.false;
		expect(card.asEvidence()).is.undefined;
		const evidenceValue = randomItem(EVIDENCE_CARD_VALUES);
		const evidenceType = randomItem(EVIDENCE_TYPES);
		EVIDENCE_CARD_VALUES.filter(v => v !== evidenceValue).forEach(v => card.eliminateValue(v));
		EVIDENCE_TYPES.filter(t => t !== evidenceType).forEach(t => card.eliminateType(t));
		expectSingleCard(card, evidenceType, evidenceValue);
	});

	it("can get down to 1 via set", function () {
		const card = new MysteryCard();
		expect(card.possibleCount).equals(24);
		expect(card.isKnown).is.false;
		expect(card.asEvidence()).is.undefined;
		const evidenceValue = randomItem(EVIDENCE_CARD_VALUES);
		const evidenceType = randomItem(EVIDENCE_TYPES);
		card.setType(evidenceType);
		card.setValue(evidenceValue);
		expectSingleCard(card, evidenceType, evidenceValue);
	});

	it("fromEvidenceCard creates a single", function () {
		const evidenceValue = randomItem(EVIDENCE_CARD_VALUES);
		const evidenceType = randomItem(EVIDENCE_TYPES);
		const card = MysteryCard.fromEvidenceCard({
			cardType: CardType.Evidence,
			evidenceType,
			evidenceValue,
		});
		expectSingleCard(card, evidenceType, evidenceValue);
	});
});