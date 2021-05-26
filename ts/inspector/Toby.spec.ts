import { expect } from "chai";
import { describe, it } from "mocha";
import { Bot } from "../Bot";
import { evidence, EvidenceCard } from "../EvidenceCard";
import { EvidenceType } from "../EvidenceType";
import { leadCard } from "../LeadCard";
import { LeadType } from "../LeadType";
import { MysteryCard } from "../MysteryCard";
import { MysteryPile } from "../MysteryPile";
import { BottomOrTop, TobyInspectorStrategy, TobyOption } from "./Toby";
import { TurnStart } from "../TurnStart";
import { VisibleLead } from "../VisibleBoard";

const strategy = () => new TobyInspectorStrategy();

function lead(leadType: LeadType, evidenceType: EvidenceType, evidenceTarget: number, evidenceValue = 0): VisibleLead {
	return <VisibleLead> {
		badCards: [] as EvidenceCard[],
		badValue: 0,
		confirmed: false,
		evidenceCards: [] as EvidenceCard[],
		evidenceValue,
		leadCard: leadCard(leadType, evidenceType, evidenceTarget),
	};
}

function turn(
	investigationMarker = 10,
	witnessEvidenceValue = 0,
): TurnStart {
	return <TurnStart> {
		board: {
			investigationMarker,
			leads: {
				[LeadType.Motive]: lead(LeadType.Motive, EvidenceType.Track, 7),
				[LeadType.Opportunity]: lead(LeadType.Opportunity, EvidenceType.Document, 7),
				[LeadType.Suspect]: lead(LeadType.Suspect, EvidenceType.Witness, 7, witnessEvidenceValue),
			},
			remainingEvidenceCount: 10,
		},
	};
}

function bot(hand: MysteryCard[] = []): Bot {
	return <Bot> {
		hand,
		remainingEvidence: <MysteryPile> {
			couldBe: (evidenceCard: EvidenceCard) => true,
		},
	};
}

interface TobyStandardTest {
	bottomOrTop: BottomOrTop;
	clue6: EvidenceCard;
	mystery: MysteryCard;
	option: TobyOption;
	toby: TobyInspectorStrategy;
}

function standardSetup(
	investigationMarker = 10,
	evidenceType: EvidenceType = EvidenceType.Clue,
	witnessEvidenceValue = 0,
): TobyStandardTest {
	const clue6 = evidence(6, evidenceType);
	const mystery = new MysteryCard([evidenceType], [ 1, 6 ]);
	const toby = strategy();
	const option = toby.buildOptions(turn(investigationMarker, witnessEvidenceValue), bot([mystery]))[0];
	expect(option).is.not.undefined;
	const bottomOrTop = option.action.onReveal(clue6);
	if (bottomOrTop === BottomOrTop.Top) {
		expect(toby.rememberedEvidence).deep.equals(clue6);
	} else {
		expect(toby.rememberedEvidence).is.undefined;
	}
	return { bottomOrTop, clue6, mystery, option, toby };
}

describe("TobyInspectorStrategy", function () {
	describe("buildTobyOnReveal", function () {
		it("puts the card on top if it would complete the investigation", function () {
			const { bottomOrTop } = standardSetup(14);
			expect(bottomOrTop).equals(BottomOrTop.Top);
		});
		it("puts the card on the bottom if it's too big", function () {
			const { bottomOrTop } = standardSetup(15);
			expect(bottomOrTop).equals(BottomOrTop.Bottom);
		});
		it("puts the card on the top if it could be used with a lead", function () {
			const { bottomOrTop } = standardSetup(15, EvidenceType.Witness);
			expect(bottomOrTop).equals(BottomOrTop.Top);
		});
		it("puts the card on the bottom if it would be too big for the lead", function () {
			const { bottomOrTop } = standardSetup(10, EvidenceType.Witness, 5);
			expect(bottomOrTop).equals(BottomOrTop.Bottom);
		});
	});
	describe("addCard", function () {
		it("updates the hand and resets rememberedEvidence", function () {
			const { clue6, mystery, toby } = standardSetup();
			expect(mystery.possibleCount).equals(2);
			expect(mystery.possibleValues).deep.equals([ 1, 6 ]);
			const before = toby.addCard(0, undefined, true, mystery);
			expect(before).deep.equals(clue6);
			expect(toby.rememberedEvidence).is.undefined;
			expect(mystery.possibleCount).equals(1);
			expect(mystery.possibleValues).deep.equals([6]);
		});
	});
	describe("sawEvidenceDealt", function () {
		it("resets rememberedEvidence", function () {
			const { toby } = standardSetup();
			expect(toby.rememberedEvidence).is.not.undefined;
			toby.sawEvidenceDealt();
			expect(toby.rememberedEvidence).is.undefined;
		});
	});
	describe("sawEvidenceReturned", function () {
		it("resets rememberedEvidence on shuffle", function () {
			const { toby } = standardSetup();
			expect(toby.rememberedEvidence).is.not.undefined;
			toby.sawEvidenceReturned([], BottomOrTop.Bottom, true);
			expect(toby.rememberedEvidence).is.undefined;
		});
		it("resets rememberedEvidence on Top+new evidence", function () {
			const { toby } = standardSetup();
			expect(toby.rememberedEvidence).is.not.undefined;
			toby.sawEvidenceReturned([evidence(5, EvidenceType.Witness)], BottomOrTop.Top, false);
			expect(toby.rememberedEvidence).is.undefined;
		});
		it("resets rememberedEvidence on Top+no evidence", function () {
			const { toby } = standardSetup();
			expect(toby.rememberedEvidence).is.not.undefined;
			toby.sawEvidenceReturned([], BottomOrTop.Top, false);
			expect(toby.rememberedEvidence).is.undefined;
		});
		it("resets rememberedEvidence on Bottom+seen evidence", function () {
			const { clue6, toby } = standardSetup();
			expect(toby.rememberedEvidence).is.not.undefined;
			toby.sawEvidenceReturned([clue6], BottomOrTop.Bottom, false);
			expect(toby.rememberedEvidence).is.undefined;
		});
		it("keeps rememberedEvidence on Top+seen evidence", function () {
			const { clue6, toby } = standardSetup();
			expect(toby.rememberedEvidence).is.not.undefined;
			toby.sawEvidenceReturned([clue6], BottomOrTop.Top, false);
			expect(toby.rememberedEvidence).deep.equals(clue6);
		});
	});
});
