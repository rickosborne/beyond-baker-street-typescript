import { expect } from "chai";
import { describe } from "mocha";
import { ActionType } from "./ActionType";
import { sum } from "./arrayMath";
import { BaskervilleAction } from "./Baskerville";
import { BadOrGood, Board, BoardLead } from "./Board";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { evidence, EvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { HOLMES_GOAL, INVESTIGATION_MARKER_GOAL } from "./Game";
import { leadCard } from "./LeadCard";
import { LEAD_TYPES, LeadType } from "./LeadType";
import { Pile } from "./Pile";
import { allPathsTo } from "./summingPathsTo";
import { BottomOrTop } from "./Toby";

function buildBoard(
	leads?: Record<LeadType, BoardLead> | undefined,
): Board {
	return new Board(CASE_FILE_CARDS[5], undefined, leads);
}

function buildBoardLead(
	leadType: LeadType = LeadType.Motive,
	evidenceType: EvidenceType = EvidenceType.Clue,
): BoardLead {
	const boardLead = new BoardLead(leadType, undefined, [leadCard(leadType, evidenceType, 9)]);
	expect(boardLead.evidenceValue).equals(0);
	expect(boardLead.evidenceCards).is.an("array").and.is.empty;
	expect(boardLead.badValue).equals(0);
	expect(boardLead.badCards).is.an("array").and.is.empty;
	return boardLead;
}

const clue6 = evidence(6, EvidenceType.Clue);
const clue5 = evidence(5, EvidenceType.Clue);
const track2 = evidence(2, EvidenceType.Track);
const track4 = evidence(4, EvidenceType.Track);

describe("Board", function () {
	it("addEvidence does what it says", function () {
		const board = buildBoard();
		const motive = board.leads[LeadType.Motive];
		const evidenceType = motive.leadCard.evidenceType;
		const otherType = evidenceType === EvidenceType.Track ? EvidenceType.Clue : EvidenceType.Track;
		expect(motive.badValue).equals(0);
		expect(motive.evidenceValue).equals(0);
		expect(motive.badCards).lengthOf(0);
		expect(board.addEvidence(LeadType.Motive, evidence(1, otherType))).equals(BadOrGood.Bad);
		expect(motive.badValue).equals(1);
		expect(motive.evidenceValue).equals(0);
		expect(board.addEvidence(LeadType.Motive, evidence(2, evidenceType))).equals(BadOrGood.Good);
		expect(motive.badValue).equals(1);
		expect(motive.evidenceValue).equals(2);
	});
	it("addImpossible does what it says", function () {
		const board = buildBoard();
		expect(board.impossibleCount).equals(0);
		expect(board.impossibleLimit).equals(1);
		expect(board.impossibleCards).is.empty;
		expect(board.holmesLocation).equals(8);
		board.addImpossible(track2, true);
		expect(board.impossibleCount).equals(1);
		expect(board.impossibleCards).has.members([track2]);
		expect(board.holmesLocation).equals(8);
		expect(board.investigationMarker).equals(2);
		board.addImpossible(clue6, true);
		expect(board.impossibleCount).equals(2);
		expect(board.impossibleCards).has.members([ track2, clue6 ]);
		expect(board.holmesLocation).equals(7);
		expect(board.investigationMarker).equals(8);
		board.addImpossible(clue5, false);
		expect(board.impossibleCount).equals(3);
		expect(board.impossibleCards).has.members([ track2, clue6, clue5 ]);
		expect(board.holmesLocation).equals(7);
		expect(board.investigationMarker).equals(13);
	});
	it("allConfirmed does what it says", function () {
		const board = buildBoard();
		expect(board.allConfirmed).is.false;
		for (const leadType of LEAD_TYPES) {
			const lead = board.leads[leadType];
			const { evidenceTarget, evidenceType } = lead.leadCard;
			const path = allPathsTo(evidenceTarget)[0];
			for (const evidenceValue of path) {
				board.addEvidence(leadType, evidence(evidenceValue, evidenceType));
			}
			expect(board.isConfirmed(leadType)).is.false;
			board.confirm(leadType);
			expect(board.isConfirmed(leadType)).is.true;
			expect(() => board.confirm(leadType)).throws("already confirmed");
		}
		expect(board.allConfirmed).is.true;
	});
	it("anyEmptyLeads does what it says", function () {
		const board = buildBoard();
		expect(board.anyEmptyLeads).is.false;
		const motive = board.leads[LeadType.Motive];
		while (motive.leadCount > 0) {
			board.removeLead(LeadType.Motive);
		}
		expect(board.anyEmptyLeads).is.true;
	});

	it("baskervilleSwap does what it says", function () {
		const board = buildBoard();
		const motive = board.leads[LeadType.Motive];
		const leadEvidenceType = motive.leadCard.evidenceType;
		const leadEvidence = evidence(1, leadEvidenceType);
		const leadEvidenceRemain = evidence(2, leadEvidenceType);
		const impossibleEvidenceType = leadEvidence.evidenceType === EvidenceType.Clue ? EvidenceType.Document : EvidenceType.Clue;
		const impossibleEvidence = evidence(6, impossibleEvidenceType);
		expect(board.addEvidence(LeadType.Motive, leadEvidence)).equals(BadOrGood.Good);
		expect(board.addEvidence(LeadType.Motive, leadEvidenceRemain)).equals(BadOrGood.Good);
		board.addImpossible(impossibleEvidence);
		expect(board.investigationMarker).equals(impossibleEvidence.evidenceValue);
		expect(board.investigationMarker).equals(6);
		expect(() => board.baskervilleSwap(<BaskervilleAction> {
			actionType: ActionType.Baskerville,
			impossibleEvidence: evidence(3, EvidenceType.Witness),
			leadEvidence,
			leadType: LeadType.Motive,
		})).throws("Not impossible");
		expect(() => board.baskervilleSwap(<BaskervilleAction> {
			actionType: ActionType.Baskerville,
			impossibleEvidence,
			leadEvidence: evidence(3, EvidenceType.Witness),
			leadType: LeadType.Motive,
		})).throws("Not on the lead");
		expect(board.baskervilleSwap(<BaskervilleAction> {
			actionType: ActionType.Baskerville,
			impossibleEvidence,
			leadEvidence,
			leadType: LeadType.Motive,
		}), "delta").equals(-5);
		expect(board.impossibleCount).equals(1);
		expect(board.impossibleCards).deep.equals([leadEvidence]);
		expect(board.investigationMarker).equals(leadEvidence.evidenceValue);
		expect(motive.includes(leadEvidence)).is.false;
		expect(motive.includes(impossibleEvidence)).is.true;
		expect(motive.badValue).equals(impossibleEvidence.evidenceValue);
		expect(motive.badCards).deep.equals([impossibleEvidence]);
		expect(motive.evidenceValue).equals(leadEvidenceRemain.evidenceValue);
		expect(motive.evidenceCards).deep.equals([leadEvidenceRemain]);
	});
	it("calculate* functions work", function () {
		const board = buildBoard();
		const motive = board.leads[LeadType.Motive];
		const leadEvidenceType = motive.leadCard.evidenceType;
		const otherEvidenceType = leadEvidenceType === EvidenceType.Clue ? EvidenceType.Document : EvidenceType.Clue;
		const evidenceTarget = board.targetForLead(LeadType.Motive);
		board.addEvidence(LeadType.Motive, evidence(6, otherEvidenceType));
		board.addEvidence(LeadType.Motive, evidence(4, otherEvidenceType));
		board.addEvidence(LeadType.Motive, evidence(1, leadEvidenceType));
		board.addEvidence(LeadType.Motive, evidence(2, leadEvidenceType));
		expect(board.calculateBadFor(LeadType.Motive)).equals(10);
		expect(board.calculateEvidenceValueFor(LeadType.Motive)).equals(3);
		expect(board.calculateTotalFor(LeadType.Motive)).equals(10 + evidenceTarget);
		expect(board.calculateGapFor(LeadType.Motive)).equals(7 + evidenceTarget);
		board.removeEvidenceFor(LeadType.Motive);
		expect(board.calculateBadFor(LeadType.Motive)).equals(0);
		expect(board.calculateEvidenceValueFor(LeadType.Motive)).equals(0);
		expect(board.calculateTotalFor(LeadType.Motive)).equals(evidenceTarget);
		expect(board.calculateGapFor(LeadType.Motive)).equals(evidenceTarget);
	});
	it("dealEvidence works", function () {
		const board = buildBoard();
		const remainingEvidence = board.toJSON().remainingEvidence as Pile<EvidenceCard>;
		const before = remainingEvidence.topCard;
		const countBefore = board.remainingEvidenceCount;
		expect(board).is.not.undefined;
		const dealt = board.dealEvidence();
		expect(dealt).equals(before);
		expect(remainingEvidence.topCard).does.not.equal(before);
		expect(board.remainingEvidenceCount).equals(countBefore - 1);
	});
	it("holmesWon works", function () {
		const board = buildBoard();
		expect(board.holmesWon).is.false;
		expect(board.moveHolmes(0 - board.holmesLocation)).equals(HOLMES_GOAL);
		expect(board.holmesWon).is.true;
	});
	it("investigationComplete works", function () {
		const board = buildBoard();
		expect(board.investigationComplete).is.false;
		expect(board.moveInvestigationMarker(INVESTIGATION_MARKER_GOAL - board.investigationMarker)).equals(INVESTIGATION_MARKER_GOAL);
		expect(board.investigationComplete).is.true;
		expect(board.investigationOver).is.false;
		board.moveInvestigationMarker(1);
		expect(board.investigationOver).is.true;
	});
	it("raiseImpossibleLimitBy1 works", function () {
		const board = buildBoard();
		const before = board.impossibleLimit;
		board.raiseImpossibleLimitBy1();
		expect(board.impossibleLimit).equals(before + 1);
	});
	it("removeFromImpossible works", function () {
		const board = buildBoard();
		board.addImpossible(clue6);
		board.addImpossible(track2);
		board.addImpossible(track4);
		expect(board.investigationMarker).equals(12);
		expect(() => board.removeFromImpossible(clue5)).throws("Not impossible");
		board.removeFromImpossible(track2);
		expect(board.investigationMarker).equals(10);
		board.removeFromImpossible(clue6);
		expect(board.investigationMarker).equals(4);
		board.removeFromImpossible(track4);
		expect(board.investigationMarker).equals(0);
	});
	it("returnEvidence", function () {
		const board = buildBoard();
		const remaining = board.toJSON().remainingEvidence as Pile<EvidenceCard>;
		const a = board.dealEvidence() as EvidenceCard;
		const b = board.dealEvidence() as EvidenceCard;
		const c = board.dealEvidence() as EvidenceCard;
		const d = board.dealEvidence() as EvidenceCard;
		const topBefore = remaining.topCard as EvidenceCard;
		expect(remaining.bottomCard).does.not.equal(c);
		board.returnEvidence([c], false, BottomOrTop.Bottom);
		expect(remaining.bottomCard).equals(c);
		expect(remaining.topCard).equals(topBefore);
		board.returnEvidence([ a, b ], false, BottomOrTop.Top);
		expect(remaining.bottomCard).equals(c);
		expect(remaining.topCard).equals(b);
		expect(remaining.find(c => isSameEvidenceCard(c, d))).is.undefined;
		board.returnEvidence([d], true, BottomOrTop.Top);
		expect(remaining.find(c => isSameEvidenceCard(c, d))).equals(d);
	});
});

describe("BoardLead", function () {
	it("addCard does what it says", function () {
		const boardLead = buildBoardLead();
		expect(boardLead.addEvidence(track2)).equals(BadOrGood.Bad);
		expect(boardLead.badValue).equals(2);
		expect(boardLead.badCards).has.members([track2]);
		expect(boardLead.evidenceValue).equals(0);
		expect(boardLead.evidenceCards).is.an("array").and.is.empty;
		expect(boardLead.addEvidence(track4)).equals(BadOrGood.Bad);
		expect(boardLead.badValue).equals(6);
		expect(boardLead.badCards).has.members([ track2, track4 ]);
		expect(boardLead.evidenceValue).equals(0);
		expect(boardLead.evidenceCards).is.an("array").and.is.empty;
	});
	it("addEvidence does what it says", function () {
		const boardLead = buildBoardLead();
		expect(boardLead.addEvidence(clue6)).equals(BadOrGood.Good);
		expect(boardLead.evidenceValue).equals(6);
		expect(boardLead.evidenceCards).has.members([clue6]);
		expect(boardLead.badValue).equals(0);
		expect(boardLead.badCards).is.an("array").and.is.empty;
		expect(boardLead.addEvidence(clue5)).equals(BadOrGood.Good);
		expect(boardLead.evidenceValue).equals(11);
		expect(boardLead.evidenceCards).has.members([ clue6, clue5 ]);
		expect(boardLead.badValue).equals(0);
		expect(boardLead.badCards).is.an("array").and.is.empty;
	});
	it("confirm does what it says", function () {
		const boardLead = buildBoardLead();
		expect(boardLead.confirmed).is.false;
		expect(boardLead.addEvidence(clue6)).equals(BadOrGood.Good);
		expect(() => boardLead.confirm()).throws("evidence doesn't add up");
		expect(boardLead.addEvidence(track2)).equals(BadOrGood.Bad);
		expect(() => boardLead.confirm()).throws("evidence doesn't add up");
		expect(boardLead.addEvidence(clue5)).equals(BadOrGood.Good);
		boardLead.confirm();
		expect(boardLead.confirmed).is.true;
	});
	it("empty and removeLead do what they say", function () {
		const boardLead = buildBoardLead();
		expect(boardLead.leadCount).equals(1);
		expect(boardLead.empty).is.false;
		boardLead.removeLead();
		expect(boardLead.leadCount).equals(0);
		expect(boardLead.empty).is.true;
		expect(() => boardLead.removeLead()).throws("out of leads");
	});
	it("removeAllEvidence does what it says", function () {
		const boardLead = buildBoardLead();
		expect(boardLead.addEvidence(clue6)).equals(BadOrGood.Good);
		expect(boardLead.addEvidence(clue5)).equals(BadOrGood.Good);
		expect(boardLead.addEvidence(track2)).equals(BadOrGood.Bad);
		expect(boardLead.addEvidence(track4)).equals(BadOrGood.Bad);
		expect(boardLead.evidenceValue).equals(11);
		expect(boardLead.badValue).equals(6);
		const removed = boardLead.removeAllEvidence();
		expect(boardLead.evidenceValue).equals(0);
		expect(boardLead.badValue).equals(0);
		expect(boardLead.evidenceCards).is.an("array").and.is.empty;
		expect(boardLead.badCards).is.an("array").and.is.empty;
		expect(removed).has.members([ clue6, clue5, track2, track4 ]);
	});

	function testBaskervilleSwap(
		leadEvidence: EvidenceCard,
		impossibleEvidence: EvidenceCard,
		goodAfter: EvidenceCard[],
		badAfter: EvidenceCard[],
	): void {
		const boardLead = buildBoardLead();
		expect(boardLead.addEvidence(clue6)).equals(BadOrGood.Good);
		expect(boardLead.addEvidence(track2)).equals(BadOrGood.Bad);
		expect(boardLead.evidenceValue).equals(6);
		expect(boardLead.evidenceCards).has.members([clue6]);
		expect(boardLead.badValue).equals(2);
		expect(boardLead.badCards).has.members([track2]);
		boardLead.baskervilleSwap(leadEvidence, impossibleEvidence);
		expect(boardLead.evidenceValue).equals(sum(goodAfter.map(c => c.evidenceValue)));
		expect(boardLead.evidenceCards).has.members(goodAfter);
		expect(boardLead.badValue).equals(sum(badAfter.map(c => c.evidenceValue)));
		expect(boardLead.badCards).has.members(badAfter);
	}

	it("baskervilleSwap handles good for good", function () {
		testBaskervilleSwap(clue6, clue5, [clue5], [track2]);
	});
	it("baskervilleSwap handles good for bad", function () {
		testBaskervilleSwap(track2, clue5, [ clue6, clue5 ], []);
	});
	it("baskervilleSwap handles bad for bad", function () {
		testBaskervilleSwap(track2, track4, [clue6], [track4]);
	});
	it("baskervilleSwap handles bad for good", function () {
		testBaskervilleSwap(clue6, track4, [], [ track2, track4 ]);
	});
	it("baskervilleSwap throws for not found", function () {
		expect(() => testBaskervilleSwap(clue5, track4, [], [])).throws("Pile should have had");
	});
});

