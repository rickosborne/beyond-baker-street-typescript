import { expect } from "chai";
import { describe } from "mocha";
import { Action } from "./Action";
import { BlackwellChoice, BlackwellTurn } from "./Blackwell";
import { evidence, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { GamePlayer } from "./Game";
import { InspectorType } from "./InspectorType";
import { OtherHand } from "./OtherHand";
import { Outcome } from "./Outcome";
import { ActivePlayer, Player } from "./Player";
import { BottomOrTop } from "./Toby";
import { TurnStart } from "./TurnStart";

const witness3 = evidence(3, EvidenceType.Witness);
const document4 = evidence(3, EvidenceType.Document);

describe("GamePlayer", function () {
	it("addCard/removeCardAt", function () {
		let lastAddedCard: { evidenceCard: EvidenceCard | undefined; fromRemainingEvidence: boolean; index: number; } | undefined = undefined;
		let lastRemovedCard: number | undefined = undefined;
		const active = <ActivePlayer> {
			addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean): void {
				lastAddedCard = { evidenceCard, fromRemainingEvidence, index };
			},
			removeCardAt(index: number): void {
				lastRemovedCard = index;
			},
		};
		const gp = new GamePlayer(active);
		expect(() => gp.addCard(0, undefined, false, false)).throws("Expected evidence card");
		expect(lastAddedCard).is.undefined;
		gp.addCard(0, witness3, false, false);
		expect(gp.hand).has.members([witness3]);
		expect(lastAddedCard).deep.equals({
			evidenceCard: undefined,
			fromRemainingEvidence: false,
			index: 0,
		});
		lastAddedCard = undefined;
		gp.addCard(1, document4, true, true);
		expect(gp.hand).has.members([ witness3, document4 ]);
		expect(lastAddedCard).deep.equals({
			evidenceCard: document4,
			fromRemainingEvidence: true,
			index: 1,
		});
		lastAddedCard = undefined;
		expect(lastRemovedCard).is.undefined;
		expect(gp.removeCardAt(0)).equals(witness3);
		expect(lastRemovedCard).equals(0);
		lastRemovedCard = undefined;
		expect(gp.hand).has.members([document4]);
	});
	it("chooseForBlackwell delegates", function () {
		const bc = <BlackwellChoice> {};
		const bt = <BlackwellTurn> {};
		const active = <ActivePlayer> {
			chooseForBlackwell(blackwellTurn: BlackwellTurn): BlackwellChoice {
				expect(blackwellTurn).equals(bt);
				return bc;
			},
		};
		const gp = new GamePlayer(active);
		expect(gp.chooseForBlackwell(bt)).equals(bc);
	});
	it("inspector delegates", function () {
		const inspector = InspectorType.Martin;
		const active = <ActivePlayer> { inspector };
		const gp = new GamePlayer(active);
		expect(gp.inspector).equals(inspector);
	});
	it("name delegates", function () {
		const name = "someName";
		const active = <ActivePlayer> { name };
		const gp = new GamePlayer(active);
		expect(gp.name).equals(name);
	});
	it("otherHand delegates", function () {
		const otherHand = <OtherHand> {};
		const active = <ActivePlayer> { otherHand };
		const gp = new GamePlayer(active);
		expect(gp.otherHand).equals(otherHand);
	});
	it("sawEvidenceDealt delegates", function () {
		const p = <Player> { name: "p" };
		let lastSaw: Player | undefined = undefined;
		const active = <ActivePlayer> {
			sawEvidenceDealt(player: Player): void {
				expect(player).equals(p);
				lastSaw = player;
			},
		};
		const gp = new GamePlayer(active);
		expect(lastSaw).is.undefined;
		gp.sawEvidenceDealt(p);
		expect(lastSaw).equals(p);
	});
	it("sawEvidenceReturned delegates", function () {
		const cards = [witness3];
		let lastSaw: {bottomOrTop: BottomOrTop, evidenceCards: EvidenceCard[], shuffle: boolean} | undefined = undefined;
		const active = <ActivePlayer> {
			sawEvidenceReturned(evidenceCards: EvidenceCard[], bottomOrTop: BottomOrTop, shuffle: boolean): void {
				lastSaw = { bottomOrTop, evidenceCards, shuffle };
			},
		};
		const gp = new GamePlayer(active);
		expect(lastSaw).is.undefined;
		gp.sawEvidenceReturned(cards, BottomOrTop.Bottom, true);
		expect(lastSaw).deep.equals({
			bottomOrTop: BottomOrTop.Bottom,
			evidenceCards: cards,
			shuffle: true,
		});
	});
	it("sawOutcome delegates", function () {
		const expected = <Outcome> {};
		let last: Outcome | undefined = undefined;
		const active = <ActivePlayer> {
			sawOutcome(outcome: Outcome): void {
				expect(outcome).equals(expected);
				last = outcome;
			},
		};
		const gp = new GamePlayer(active);
		expect(last).is.undefined;
		gp.sawOutcome(expected);
		expect(last).equals(expected);
	});
	it("takeTurn delegates", function () {
		const expectedTurn = <TurnStart> {};
		const action = <Action> {};
		let last: TurnStart | undefined = undefined;
		const active = <ActivePlayer> {
			takeTurn(turnStart: TurnStart): Action {
				expect(turnStart).equals(expectedTurn);
				last = turnStart;
				return action;
			},
		};
		const gp = new GamePlayer(active);
		expect(last).is.undefined;
		expect(gp.takeTurn(expectedTurn)).equals(action);
		expect(last).equals(expectedTurn);
	});
	it("toJSON", function () {
		const gp = new GamePlayer(<ActivePlayer> {
			addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean): void {
				// do nothing
			},
			name: "active",
		});
		gp.addCard(0, witness3, true);
		expect(gp.toJSON()).deep.includes({ hand: [witness3], name: "active" });
	});
});

describe("Game", function () {

});
