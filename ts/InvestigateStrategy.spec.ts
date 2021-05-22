import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { evidence, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { ImpossibleCard } from "./Impossible";
import {
	buildInvestigateEffectsForLeadWithCard,
	buildOptionForLeadWithCard,
	InvestigateStrategy,
} from "./InvestigateStrategy";
import { LeadType } from "./LeadType";
import { MysteryCard } from "./MysteryCard";
import { OtherPlayer } from "./Player";
import { TurnStart } from "./TurnStart";
import { VisibleLead } from "./VisibleBoard";

const strategy = new InvestigateStrategy();

function turn(): TurnStart {
	return <TurnStart> {
		board: {
			impossibleCards: [evidence(1, EvidenceType.Track)] as ImpossibleCard[],
			leads: {
				[LeadType.Motive]: {
					badCards: [] as EvidenceCard[],
					badValue: 0,
					confirmed: false,
					evidenceCards: [
						evidence(4, EvidenceType.Document),
						evidence(2, EvidenceType.Document),
					] as EvidenceCard[],
					evidenceValue: 6,
					leadCard: {
						cardType: CardType.Lead,
						evidenceTarget: 8,
						evidenceType: EvidenceType.Document,
						leadType: LeadType.Motive,
					},
				},
				[LeadType.Opportunity]: {
					badCards: [] as EvidenceCard[],
					badValue: 0,
					confirmed: false,
					evidenceCards: [] as EvidenceCard[],
					evidenceValue: 0,
					leadCard: {
						cardType: CardType.Lead,
						evidenceTarget: 7,
						evidenceType: EvidenceType.Witness,
						leadType: LeadType.Opportunity,
					},
				},
				[LeadType.Suspect]: {
					badCards: [] as EvidenceCard[],
					badValue: 0,
					confirmed: false,
					evidenceCards: [] as EvidenceCard[],
					evidenceValue: 0,
					leadCard: {
						cardType: CardType.Lead,
						evidenceTarget: 7,
						evidenceType: EvidenceType.Track,
						leadType: LeadType.Suspect,
					},
				},
			},
		},
		otherPlayers: [] as OtherPlayer[],
	};
}

function lead(evidenceType: EvidenceType, gap = 7): VisibleLead {
	return <VisibleLead> {
		badValue: 0,
		confirmed: false,
		evidenceValue: 7 - gap,
		leadCard: {
			cardType: CardType.Lead,
			evidenceTarget: 7,
			evidenceType,
			leadType: LeadType.Motive,
		},
	};
}

describe("InvestigateStrategy", function () {
	describe("buildOptionForLeadWithCard", function () {
		it("", function () {
			const mysteryCard = new MysteryCard([], []);
			expect(buildOptionForLeadWithCard(LeadType.Motive, 1, [BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge], mysteryCard)).deep.includes({
				action: {
					actionType: ActionType.Investigate,
					handIndex: 1,
					leadType: LeadType.Motive,
				},
				effects: [BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge],
				mysteryCard,
				strategyType: BotTurnStrategyType.Investigate,
			});
		});
	});

	describe("buildEffectsForLeadWithCard", function () {
		it("handles InvestigateBadOnWedged", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track), new MysteryCard([EvidenceType.Clue], [1]), [4], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadOnWedged ]);
		});
		it("handles InvestigateBadOnWedged", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 1), new MysteryCard([EvidenceType.Clue], [2]), [4], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadOnWedged ]);
		});
		it("handles InvestigateUnwedgeForAvailable", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 1), new MysteryCard([EvidenceType.Clue], [3]), [4], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateUnwedgeForAvailable ]);
		});
		it("handles InvestigateBadOnUnwedgedDoesWedge", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 7), new MysteryCard([EvidenceType.Clue], [1]), [ 1, 6 ], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge ]);
		});
		it("handles InvestigateBadOnUnwedgedDoesWedge", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 7), new MysteryCard([EvidenceType.Clue], [6]), [ 1, 6 ], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge ]);
		});
		it("handles InvestigateWouldWedgeLead", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 7), new MysteryCard([EvidenceType.Track], [6]), [ 4, 5 ], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodButWouldWedge ]);
		});
		it("handles InvestigateWouldWedgeLead", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 6), new MysteryCard([EvidenceType.Track], [6]), [], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodMakesConfirmable ]);
		});
		it("handles InvestigateCorrectValue", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 6), new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [6]), [], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadOnWedged, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodMakesConfirmable ]);
		});
		it("handles InvestigateMaybeBad", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 5), new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [ 2, 3, 4 ], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadButAvailable, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodAndAvailable, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateTooFar ]);
		});
		it("handles InvestigateCorrectType", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 5), new MysteryCard([EvidenceType.Track], [ 1, 4 ]), [ 1, 2, 3, 5, 6 ], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodButWouldWedge, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodAndAvailable ]);
		});
		it("handles InvestigateWild", function () {
			expect(buildInvestigateEffectsForLeadWithCard(lead(EvidenceType.Track, 10), new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 4 ]), [ 2, 3, 5, 6 ], []))
				.deep.equals([ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadButAvailable, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodAndAvailable, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateBadButAvailable, BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateGoodAndAvailable ]);
		});
	});

	describe("buildOptions", function () {
		it("does what it says", function () {
			const mysteryCard = new MysteryCard([EvidenceType.Track], [6]);
			const options = strategy.buildOptions(turn(), <Bot> {
				hand: [mysteryCard] as MysteryCard[],
			});
			expect(options).has.deep.members([
				buildOptionForLeadWithCard(LeadType.Motive, 0, [ BotTurnEffectType.InvestigatePossibility, BotTurnEffectType.InvestigateUnwedgeForAvailable ], mysteryCard),
				buildOptionForLeadWithCard(LeadType.Opportunity, 0, [ BotTurnEffectType.InvestigateBadButAvailable, BotTurnEffectType.InvestigatePossibility ], mysteryCard),
				buildOptionForLeadWithCard(LeadType.Suspect, 0, [ BotTurnEffectType.InvestigateGoodButWouldWedge, BotTurnEffectType.InvestigatePossibility ], mysteryCard),
			]);
		});
	});
});
