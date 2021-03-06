import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { buildEliminateEffects, buildEliminateOption, EliminateStrategy } from "./EliminateStrategy";
import { EVIDENCE_CARDS, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { InspectorType } from "./InspectorType";
import { LeadType } from "./LeadType";
import { MysteryCard } from "./MysteryCard";
import { OtherPlayer } from "./Player";
import { TurnStart } from "./TurnStart";

const strategy = new EliminateStrategy();

function turn(
	investigationMarker: number,
	holmesLocation: number,
	impossibleLength: number,
	impossibleLimit: number,
	stomp = false
): TurnStart {
	const hand: EvidenceCard[] = [];
	if (stomp) {
		hand.push(<EvidenceCard>{
			evidenceType: EvidenceType.Witness,
			evidenceValue: INVESTIGATION_MARKER_GOAL - investigationMarker,
		});
	}
	return <TurnStart>{
		board: {
			caseFile: {
				impossibleLimit,
			},
			holmesLocation,
			impossibleCards: EVIDENCE_CARDS.slice(0, impossibleLength),
			impossibleLimit,
			investigationMarker,
			leads: {
				[LeadType.Motive]: {
					badCards: [] as EvidenceCard[],
					evidenceCards: [] as EvidenceCard[],
					leadCard: {
						evidenceType: EvidenceType.Clue,
					},
				},
				[LeadType.Opportunity]: {
					badCards: [] as EvidenceCard[],
					evidenceCards: [] as EvidenceCard[],
					leadCard: {
						evidenceType: EvidenceType.Clue,
					},
				},
				[LeadType.Suspect]: {
					badCards: [] as EvidenceCard[],
					evidenceCards: [] as EvidenceCard[],
					leadCard: {
						evidenceType: EvidenceType.Clue,
					},
				},
			},
		},
		otherPlayers: [{
			hand,
		}] as OtherPlayer[],
	};
}

describe("EliminateStrategy", function () {
	describe("buildEliminateOption", function () {
		it("does what it says", function () {
			expect(buildEliminateOption([BotTurnEffectType.EliminatePossibility], 3)).deep.equals({
				action: {
					actionType: ActionType.Eliminate,
					handIndex: 3,
				},
				effects: [BotTurnEffectType.EliminatePossibility],
				strategyType: BotTurnStrategyType.Eliminate,
			});
		});
	});

	describe("buildEliminateEffects", function () {
		it("adds Lose effects", function () {
			expect(buildEliminateEffects(new MysteryCard([EvidenceType.Track], [6]), [], [], turn(19, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([ BotTurnEffectType.EliminateMightLose, BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateUnused ]);
		});
		it("adds Wild effects", function () {
			expect(buildEliminateEffects(new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [], [], turn(1, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, [1]))
				.has.members([
				BotTurnEffectType.ImpossibleAdded,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
			]);
		});
		it("handles Lestrade & doesn't handle Wiggins", function () {
			expect(buildEliminateEffects(new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [], [], turn(1, 2, 3, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([
				BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.HolmesProgress,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
			]);
			expect(buildEliminateEffects(new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [], [], turn(1, 1, 3, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([
				BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.HolmesProgress, BotTurnEffectType.Lose,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
			]);
			expect(buildEliminateEffects(new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [], [], turn(1, 1, 3, 2), InspectorType.Wiggins, {} as Record<EvidenceType, number[]>, []))
				.has.members([
				BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.HolmesProgress, BotTurnEffectType.Lose,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
			]);
			expect(buildEliminateEffects(new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [], [], turn(1, 1, 3, 2), InspectorType.Lestrade, {} as Record<EvidenceType, number[]>, []))
				.has.members([
				BotTurnEffectType.ImpossibleAdded,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
			]);
		});
		it("adds MaybeLose effects", function () {
			expect(buildEliminateEffects(new MysteryCard([ EvidenceType.Track, EvidenceType.Clue ], [ 1, 6 ]), [], [], turn(18, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([
				BotTurnEffectType.ImpossibleAdded,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateMightLose, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateMightLose, BotTurnEffectType.EliminateUnused,
			]);
		});
		it("adds InvestigationComplete effects", function () {
			expect(buildEliminateEffects(new MysteryCard([EvidenceType.Track], [6]), [], [], turn(14, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([ BotTurnEffectType.EliminateUnusedCompletesInvestigation, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.ImpossibleAdded ]).and;
			expect(buildEliminateEffects(new MysteryCard([EvidenceType.Clue], [6]), [], [], turn(14, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([ BotTurnEffectType.EliminateUnusedCompletesInvestigation, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.ImpossibleAdded ]).and;
		});
		it("adds SetsUpExact effects", function () {
			expect(buildEliminateEffects(new MysteryCard([EvidenceType.Track], [3]), [], [<EvidenceCard>{ evidenceValue: 6 }], turn(11, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused ]);
		});
		it("adds stomp effects", function () {
			expect(buildEliminateEffects(new MysteryCard([EvidenceType.Track], [3]), [], [<EvidenceCard>{ evidenceValue: 6 }], turn(14, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused ]);
		});
		it("adds known/unknown type effects", function () {
			expect(buildEliminateEffects(new MysteryCard([EvidenceType.Track], [ 1, 3 ]), [], [], turn(14, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([
				BotTurnEffectType.ImpossibleAdded,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
			]);
			expect(buildEliminateEffects(new MysteryCard([EvidenceType.Clue], [ 1, 3 ]), [], [], turn(14, 1, 0, 2), undefined, {} as Record<EvidenceType, number[]>, []))
				.has.members([
				BotTurnEffectType.ImpossibleAdded,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
				BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateWedgesInvestigation, BotTurnEffectType.EliminateUnused,
			]);
		});
	});

	describe("buildOptions", function () {
		xit("reduces the options based on highest average value", function () {
			const options = strategy.buildOptions(turn(14, 1, 0, 2, true), <Bot>{
				hand: [
					new MysteryCard([EvidenceType.Track], [6]),
					new MysteryCard([EvidenceType.Witness], [ 1, 2 ]),
					new MysteryCard([EvidenceType.Track], [ 4, 5 ]),
				],
			});
			const first = options.find(o => o.action.handIndex === 0);
			expect(first).deep.includes({
				"action": {
					"actionType": ActionType.Eliminate,
					"handIndex": 0,
				},
				"strategyType": BotTurnStrategyType.Eliminate,
			});
			expect(first?.effects).includes.members([
				BotTurnEffectType.EliminateUnusedCompletesInvestigation,
				BotTurnEffectType.EliminatePossibility,
				BotTurnEffectType.ImpossibleAdded,
			]);
			const second = options.find(o => o.action.handIndex === 1);
			expect(second).is.undefined;
			const third = options.find(o => o.action.handIndex === 2);
			expect(third).deep.includes({
				"action": {
					"actionType": ActionType.Eliminate,
					"handIndex": 2,
				},
				"strategyType": BotTurnStrategyType.Eliminate,
			});
			expect(third?.effects).includes.members([
				BotTurnEffectType.EliminatePossibility,
				BotTurnEffectType.EliminatePossibility,
				BotTurnEffectType.ImpossibleAdded,
			]);
		});
	});
});
