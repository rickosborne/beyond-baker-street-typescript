import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { evidence, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { buildHudsonOptionForLeadAndImpossible, HudsonInspectorStrategy } from "./Hudson";
import { ImpossibleCard } from "./Impossible";
import { LeadReverseCard } from "./LeadCard";
import { LeadType } from "./LeadType";
import { OtherPlayer } from "./Player";
import { TurnStart } from "./TurnStart";

function leadReverse(): LeadReverseCard {
	return {
		cardType: CardType.LeadReverse,
	};
}

function turn(
	impossibleCards: ImpossibleCard[],
	hand: EvidenceCard[] = [],
): TurnStart {
	return <TurnStart>{
		board: {
			impossibleCards,
			leads: {
				[LeadType.Motive]: {
					badValue: 0,
					confirmed: false,
					evidenceValue: 0,
					leadCard: {
						evidenceTarget: 7,
						evidenceType: EvidenceType.Track,
						leadType: LeadType.Motive,
					},
				},
				[LeadType.Opportunity]: {
					badValue: 0,
					confirmed: false,
					evidenceValue: 0,
					leadCard: {
						evidenceTarget: 7,
						evidenceType: EvidenceType.Clue,
						leadType: LeadType.Motive,
					},
				},
				[LeadType.Suspect]: {
					badValue: 0,
					confirmed: false,
					evidenceValue: 0,
					leadCard: {
						evidenceTarget: 7,
						evidenceType: EvidenceType.Document,
						leadType: LeadType.Motive,
					},
				},
			},
		},
		otherPlayers: [{
			hand,
		}] as OtherPlayer[],
	};
}

const strategy = new HudsonInspectorStrategy();

describe("HudsonInspectorStrategy", function () {
	describe("buildOptions", function () {
		it("handles ConfirmEventually for gap match", function () {
			expect(buildHudsonOptionForLeadAndImpossible(evidence(6, EvidenceType.Track), 6, () => []))
				.deep.includes({
				action: {
					actionType: ActionType.Hudson,
					impossibleEvidence: {
						cardType: CardType.Evidence,
						evidenceType: EvidenceType.Track,
						evidenceValue: 6,
					},
				},
				effects: [BotTurnEffectType.ConfirmEventually],
				strategyType: BotTurnStrategyType.Inspector,
			});
		});

		it("handles ConfirmEventually for within gap", function () {
			expect(buildHudsonOptionForLeadAndImpossible(evidence(6, EvidenceType.Track), 7, () => [1]))
				.deep.includes({
				action: {
					actionType: ActionType.Hudson,
					impossibleEvidence: {
						cardType: CardType.Evidence,
						evidenceType: EvidenceType.Track,
						evidenceValue: 6,
					},
				},
				effects: [BotTurnEffectType.ConfirmEventually],
				strategyType: BotTurnStrategyType.Inspector,
			});
		});

		it("handles ConfirmEventually for within gap", function () {
			expect(buildHudsonOptionForLeadAndImpossible(evidence(6, EvidenceType.Track), 7, () => [2])).is.undefined;
		});
	});

	describe("buildHudsonOptionForLeadAndImpossible", function () {
		it("does what it says", function () {
			const clue6 = evidence(6, EvidenceType.Clue);
			const options = strategy.buildOptions(turn([
				leadReverse(),
				clue6,
				leadReverse(),
			], [evidence(1, EvidenceType.Clue)]));
			expect(options).lengthOf(1);
			expect(options[0]).deep.includes({
				"action": {
					"actionType": ActionType.Hudson,
					"impossibleEvidence": clue6,
				},
				"effects": [
					BotTurnEffectType.ConfirmEventually,
				],
				"strategyType": BotTurnStrategyType.Inspector,
			});
		});

		it("returns nothing if there are no eventually-confirmable leads", function () {
			const clue6 = evidence(6, EvidenceType.Clue);
			const options = strategy.buildOptions(turn([
				leadReverse(),
				clue6,
				leadReverse(),
			], [evidence(1, EvidenceType.Track)]));
			expect(options).lengthOf(0);
		});
	});
});
