import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "../ActionType";
import {
	BaskervilleAction,
	BaskervilleInspectorStrategy,
	buildBaskervilleOption,
	buildBaskervilleOptionForImpossibleAndLead,
} from "./Baskerville";
import { BotTurnEffectType, BotTurnStrategyType } from "../BotTurn";
import { evidence, EvidenceCard } from "../EvidenceCard";
import { EvidenceType } from "../EvidenceType";
import { LeadType } from "../LeadType";
import { OtherPlayer } from "../Player";
import { TurnStart } from "../TurnStart";

function buildBaskerville(used: boolean): BaskervilleInspectorStrategy {
	const strategy = new BaskervilleInspectorStrategy();
	if (used) {
		strategy.sawBaskervilleOutcome();
	}
	return strategy;
}

describe("BaskervilleInspectorStrategy", function () {
	const impossible = evidence(1, EvidenceType.Witness);
	const lead = evidence(6, EvidenceType.Witness);
	const action: BaskervilleAction = {
		actionType: ActionType.Baskerville,
		impossibleEvidence: impossible,
		leadEvidence: lead,
		leadType: LeadType.Suspect,
	};

	describe("buildBaskervilleOption", function () {
		it("does what it says", () => {
			const option = buildBaskervilleOption(impossible, LeadType.Suspect, lead, BotTurnEffectType.ConfirmReady, BotTurnEffectType.InvestigationComplete);
			expect(option).deep.equals({
				action,
				effects: [ BotTurnEffectType.ConfirmReady, BotTurnEffectType.InvestigationComplete ],
				strategyType: BotTurnStrategyType.Inspector,
			});
		});
	});

	describe("buildBaskervilleOptionForImpossibleAndLead", function () {
		it("bails out if the investigation would fail", function () {
			const wouldBustInvestigation = buildBaskervilleOptionForImpossibleAndLead(impossible, LeadType.Suspect, lead, <TurnStart>{
				board: {
					investigationMarker: 16,
				},
			}, 7, () => []);
			expect(wouldBustInvestigation).is.undefined;
			const wouldBustLead = buildBaskervilleOptionForImpossibleAndLead(impossible, LeadType.Suspect, lead, <TurnStart>{
				board: {
					investigationMarker: 10,
				},
			}, 0, () => []);
			expect(wouldBustLead).is.undefined;
		});

		it("adds effect for complete investigation", function () {
			const wouldComplete = buildBaskervilleOptionForImpossibleAndLead(impossible, LeadType.Suspect, lead, <TurnStart>{
				board: {
					investigationMarker: 15,
				},
			}, 7, () => []);
			expect(wouldComplete).is.not.undefined;
			expect(wouldComplete?.effects).includes(BotTurnEffectType.InvestigationComplete).and.does.not.include.members([ BotTurnEffectType.ConfirmEventually, BotTurnEffectType.ConfirmReady ]);
		});

		it("adds effect for complete lead", function () {
			const wouldComplete = buildBaskervilleOptionForImpossibleAndLead(lead, LeadType.Suspect, impossible, <TurnStart>{
				board: {
					investigationMarker: 15,
				},
			}, 5, () => []);
			expect(wouldComplete).is.not.undefined;
			expect(wouldComplete?.effects).includes(BotTurnEffectType.ConfirmReady).and.does.not.include.members([ BotTurnEffectType.InvestigationComplete, BotTurnEffectType.ConfirmEventually ]);
		});

		it("tries to see a completable solution", function () {
			const wouldComplete = buildBaskervilleOptionForImpossibleAndLead(lead, LeadType.Suspect, impossible, <TurnStart>{
				board: {
					investigationMarker: 15,
				},
			}, 7, () => [2]);
			expect(wouldComplete).is.not.undefined;
			expect(wouldComplete?.effects).includes(BotTurnEffectType.ConfirmEventually).and.does.not.include.members([ BotTurnEffectType.InvestigationComplete, BotTurnEffectType.ConfirmReady ]);
		});
	});

	describe("buildOptions", function () {
		it("does nothing if already used", function () {
			const baskerville = buildBaskerville(true);
			const options = baskerville.buildOptions(undefined as unknown as TurnStart);
			expect(options).is.an("array").and.is.empty;
		});

		it("works if not already used", function () {
			const baskerville = buildBaskerville(false);
			const options = baskerville.buildOptions(<TurnStart> {
				board: {
					impossibleCards: [impossible],
					investigationMarker: 15,
					leads: {
						[LeadType.Motive]: {
							badCards: [] as EvidenceCard[],
							badValue: 0,
							confirmed: false,
							evidenceCards: [lead],
							evidenceValue: lead.evidenceValue,
							leadCard: {
								evidenceTarget: 7,
								evidenceType: impossible.evidenceType,
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
								evidenceTarget: 13,
								evidenceType: EvidenceType.Clue,
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
								evidenceTarget: 13,
								evidenceType: EvidenceType.Track,
								leadType: LeadType.Suspect,
							},
						},
					},
				},
				otherPlayers: [] as OtherPlayer[],
			});
			expect(options).is.an("array").and.has.lengthOf(1);
			expect(options[0]).deep.equals({
				"action": {
					"actionType": ActionType.Baskerville,
					"impossibleEvidence": impossible,
					"leadEvidence": lead,
					"leadType": LeadType.Motive,
				},
				"effects": [BotTurnEffectType.InvestigationComplete],
				"strategyType": BotTurnStrategyType.Inspector,
			});
		});
	});
});
