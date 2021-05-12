import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { evidence, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { ImpossibleCard } from "./Impossible";
import { buildEffectsForLeadWithCard, buildOptionForLeadWithCard, InvestigateStrategy } from "./InvestigateStrategy";
import { LeadType } from "./LeadType";
import { MysteryCard } from "./MysteryCard";
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
			expect(buildOptionForLeadWithCard(LeadType.Motive, 1, [BotTurnEffectType.InvestigateBadOnUnwedged])).deep.includes({
				action: {
					actionType: ActionType.Investigate,
					handIndex: 1,
					leadType: LeadType.Motive,
				},
				effects: [BotTurnEffectType.InvestigateBadOnUnwedged],
				strategyType: BotTurnStrategyType.Investigate,
			});
		});
	});

	describe("buildEffectsForLeadWithCard", function () {
		it("handles InvestigateBadOnWedged", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track), new MysteryCard([EvidenceType.Clue], [1]), [4]))
				.deep.equals([BotTurnEffectType.InvestigateBadOnWedged]);
		});
		it("handles InvestigateUnwedgeWithBad", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 1), new MysteryCard([EvidenceType.Clue], [ 2, 3 ]), [4]))
				.deep.equals([BotTurnEffectType.InvestigateUnwedgeWithBad]);
		});
		it("handles InvestigateBadOnUnwedged", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 7), new MysteryCard([EvidenceType.Clue], [ 1, 6 ]), [ 1, 6 ]))
				.deep.equals([BotTurnEffectType.InvestigateBadOnUnwedged]);
		});
		it("handles InvestigateWouldWedgeLead", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 7), new MysteryCard([EvidenceType.Track], [6]), [ 4, 5 ]))
				.deep.equals([BotTurnEffectType.InvestigateWouldWedge]);
		});
		it("handles InvestigateWouldWedgeLead", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 6), new MysteryCard([EvidenceType.Track], [6]), []))
				.deep.equals([BotTurnEffectType.InvestigatePerfect]);
		});
		it("handles InvestigateCorrectValue", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 6), new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [6]), []))
				.deep.equals([BotTurnEffectType.InvestigateCorrectValue]);
		});
		it("handles InvestigateMaybeBad", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 5), new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [ 2, 3, 4 ]))
				.deep.equals([BotTurnEffectType.InvestigateMaybeBad]);
		});
		it("handles InvestigateCorrectType", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 5), new MysteryCard([EvidenceType.Track], [ 1, 4 ]), [ 1, 2, 3, 5, 6 ]))
				.deep.equals([BotTurnEffectType.InvestigateCorrectType]);
		});
		it("handles InvestigateWild", function () {
			expect(buildEffectsForLeadWithCard(lead(EvidenceType.Track, 10), new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 4 ]), [ 2, 3, 5, 6 ]))
				.deep.equals([BotTurnEffectType.InvestigateWild]);
		});
	});

	describe("buildOptions", function () {
		it("does what it says", function () {
			const options = strategy.buildOptions(turn(), <Bot> {
				hand: [new MysteryCard([EvidenceType.Track], [6])] as MysteryCard[],
			});
			expect(options).lengthOf(3);
			expect(options).deep.includes.members([
				buildOptionForLeadWithCard(LeadType.Motive, 0, [BotTurnEffectType.InvestigateUnwedgeWithBad]),
				buildOptionForLeadWithCard(LeadType.Opportunity, 0, [BotTurnEffectType.InvestigateBadOnUnwedged]),
				buildOptionForLeadWithCard(LeadType.Suspect, 0, [BotTurnEffectType.InvestigateWouldWedge]),
			]);
		});
	});
});
