import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { evidence, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { ImpossibleCard } from "./Impossible";
import { leadCard } from "./LeadCard";
import { LeadType } from "./LeadType";
import { MysteryCard } from "./MysteryCard";
import { OtherPlayer } from "./Player";
import {
	buildPursueEffectsForLead,
	buildPursueOption,
	gatherEvidenceFromCards,
	PursueStrategy,
} from "./PursueStrategy";
import { TurnStart } from "./TurnStart";
import { VisibleLead } from "./VisibleBoard";

const strategy = new PursueStrategy();

function turn(
	leads: VisibleLead[],
	otherPlayers: OtherPlayer[] = [],
	impossibleCards: ImpossibleCard[] =[],
): TurnStart {
	return <TurnStart> {
		board: {
			holmesLocation: 7,
			impossibleCards,
			impossibleLimit: 4,
			leads: {
				[LeadType.Motive]: leads.filter(l => l.leadCard.leadType === LeadType.Motive)[0],
				[LeadType.Opportunity]: leads.filter(l => l.leadCard.leadType === LeadType.Opportunity)[0],
				[LeadType.Suspect]: leads.filter(l => l.leadCard.leadType === LeadType.Suspect)[0],
			},
		},
		otherPlayers,
	};
}

const confirmable = <VisibleLead> {
	badCards: [] as EvidenceCard[],
	badValue: 0,
	confirmed: false,
	evidenceCards: [ evidence(6, EvidenceType.Track), evidence(1, EvidenceType.Track) ],
	evidenceValue: 7,
	leadCard: leadCard(LeadType.Motive, EvidenceType.Track, 7),
	leadCount: 3,
};
const possible = <VisibleLead> {
	badCards: [] as EvidenceCard[],
	badValue: 0,
	confirmed: false,
	evidenceCards: [evidence(6, EvidenceType.Track)],
	evidenceValue: 6,
	leadCard: leadCard(LeadType.Motive, EvidenceType.Track, 7),
	leadCount: 3,
};
const maybe = <VisibleLead> {
	badCards: [] as EvidenceCard[],
	badValue: 0,
	confirmed: false,
	evidenceCards: [] as EvidenceCard[],
	evidenceValue: 0,
	leadCard: leadCard(LeadType.Motive, EvidenceType.Track, 7),
	leadCount: 3,
};
const maybeButOpportunity = <VisibleLead> {
	badCards: [] as EvidenceCard[],
	badValue: 0,
	confirmed: false,
	evidenceCards: [] as EvidenceCard[],
	evidenceValue: 0,
	leadCard: leadCard(LeadType.Opportunity, EvidenceType.Track, 8),
	leadCount: 3,
};
const impossibleTotal = <VisibleLead> {
	badCards: [] as EvidenceCard[],
	badValue: 9,
	confirmed: false,
	evidenceCards: [] as EvidenceCard[],
	evidenceValue: 0,
	leadCard: leadCard(LeadType.Opportunity, EvidenceType.Clue, 13),
	leadCount: 3,
};
const last = <VisibleLead> {
	badCards: [] as EvidenceCard[],
	badValue: 0,
	confirmed: false,
	evidenceCards: [] as EvidenceCard[],
	evidenceValue: 0,
	leadCard: leadCard(LeadType.Suspect, EvidenceType.Document, 8),
	leadCount: 1,
};

describe("PursueStrategy", function () {
	describe("gatherEvidenceFromCards", function () {
		it("works", function () {
			expect(gatherEvidenceFromCards(EvidenceType.Clue, [
				evidence(1, EvidenceType.Track),
				evidence(2, EvidenceType.Clue),
				evidence(3, EvidenceType.Document),
				evidence(4, EvidenceType.Clue),
			])).has.members([ 2, 4 ]);
		});
	});
	describe("buildPursueOption", function () {
		it("works", function () {
			expect(buildPursueOption(LeadType.Opportunity, [BotTurnEffectType.PursueMaybe], 1))
				.deep.equals({
				action: {
					actionType: ActionType.Pursue,
					leadType: LeadType.Opportunity,
				},
				effects: [BotTurnEffectType.PursueMaybe],
				leadCountAfter: 1,
				strategyType: BotTurnStrategyType.Pursue,
			});
		});
	});
	describe("buildPursueEffectsForLead", function () {
		it("handles PursueMaybe", function () {
			expect(buildPursueEffectsForLead(maybe, [ maybe, impossibleTotal, last ], turn([ maybe, impossibleTotal, last ]), []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursueMaybe ]);
		});
		it("handles PursueImpossible for too-high total", function () {
			expect(buildPursueEffectsForLead(impossibleTotal, [ maybe, impossibleTotal, last ], turn([ maybe, impossibleTotal, last ]), []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursueImpossible ]);
		});
		it("handles PursueImpossible for paths", function () {
			expect(buildPursueEffectsForLead(maybe, [ maybe, impossibleTotal, last ], turn([ maybe, impossibleTotal, last ], [], [
				evidence(1, EvidenceType.Track),
				evidence(2, EvidenceType.Track),
				evidence(3, EvidenceType.Track),
				evidence(4, EvidenceType.Track),
				evidence(5, EvidenceType.Track),
				evidence(6, EvidenceType.Track),
			]), []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.HolmesProgress, BotTurnEffectType.PursueImpossible ]);
		});
		it("handles Lose", function () {
			expect(buildPursueEffectsForLead(last, [ maybe, impossibleTotal, last ], turn([ maybe, impossibleTotal, last ]), []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursueMaybe, BotTurnEffectType.Lose ]);
		});
		it("handles PursueDuplicate", function () {
			expect(buildPursueEffectsForLead(maybeButOpportunity, [ maybe, maybeButOpportunity, last ], turn([ maybe, maybeButOpportunity, last ]), []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursueMaybe, BotTurnEffectType.PursueDuplicate ]);
		});
		it("handles PursueConfirmable", function () {
			expect(buildPursueEffectsForLead(confirmable, [ confirmable, impossibleTotal, last ], turn([ maybe, impossibleTotal, last ], []), []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursueConfirmable ]);
		});
		it("handles PursuePossible for paths", function () {
			expect(buildPursueEffectsForLead(possible, [ possible, impossibleTotal, last ], turn([ maybe, impossibleTotal, last ], [<OtherPlayer>{ hand: [evidence(1, EvidenceType.Track)] }]), []))
				.has.members([ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursuePossible ]);
		});
	});
	describe("buildOptions", function () {
		it("works", function () {
			const options = strategy.buildOptions(turn([ maybe, impossibleTotal, last ]), <Bot> { hand: [] as MysteryCard[] });
			expect(options).is.an("array").with.lengthOf(3);
			const motive = options.find(o => o.action.leadType === LeadType.Motive);
			const opportunity = options.find(o => o.action.leadType === LeadType.Opportunity);
			const suspect = options.find(o => o.action.leadType === LeadType.Suspect);
			expect(motive).deep.equals(buildPursueOption(LeadType.Motive, [ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursueMaybe ], 2));
			expect(opportunity).deep.equals(buildPursueOption(LeadType.Opportunity, [ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.PursueImpossible ], 2));
			expect(suspect).deep.equals(buildPursueOption(LeadType.Suspect, [ BotTurnEffectType.ImpossibleAdded, BotTurnEffectType.Lose, BotTurnEffectType.PursueMaybe ], 0));
		});
	});
});
