import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { ConfirmOption, ConfirmStrategy } from "./ConfirmStrategy";
import { InspectorType } from "./InspectorType";
import { LeadType } from "./LeadType";
import { OtherPlayer } from "./Player";
import { TurnStart } from "./TurnStart";
import { VisibleLead } from "./VisibleBoard";

const strategy = new ConfirmStrategy();

const confirmable = <VisibleLead> {
	badValue: 0,
	confirmed: false,
	evidenceValue: 7,
	leadCard: {
		evidenceTarget: 7,
		leadType: LeadType.Motive,
	},
};
const oneOff = <VisibleLead> {
	badValue: 0,
	confirmed: false,
	evidenceValue: 6,
	leadCard: {
		evidenceTarget: 7,
		leadType: LeadType.Opportunity,
	},
};
const confirmedOpportunity = <VisibleLead> {
	badValue: 0,
	confirmed: true,
	evidenceValue: 8,
	leadCard: {
		evidenceTarget: 8,
		leadType: LeadType.Opportunity,
	},
};
const confirmedSuspect = <VisibleLead> {
	badValue: 0,
	confirmed: true,
	evidenceValue: 8,
	leadCard: {
		evidenceTarget: 8,
		leadType: LeadType.Suspect,
	},
};

function turn(
	motive: VisibleLead,
	opportunity: VisibleLead,
	suspect: VisibleLead,
	investigationMarker = 0,
): TurnStart {
	return <TurnStart> {
		board: {
			investigationMarker,
			leads: {
				[LeadType.Motive]: motive,
				[LeadType.Opportunity]: opportunity,
				[LeadType.Suspect]: suspect,
			},
		},
		otherPlayers: [] as OtherPlayer[],
	};
}

function bot(inspector?: InspectorType | undefined): Bot {
	return <Bot> {
		inspector,
	};
}

function option(leadType: LeadType = LeadType.Motive, ...extraEffects: BotTurnEffectType[]): ConfirmOption {
	const effects: BotTurnEffectType[] = [ BotTurnEffectType.Confirm, BotTurnEffectType.HolmesImpeded ];
	effects.push(...extraEffects);
	return {
		"action": {
			"actionType": ActionType.Confirm,
			leadType,
		},
		effects,
		"strategyType": BotTurnStrategyType.Confirm,
	};
}

describe("ConfirmStrategy", function () {
	describe("buildOptions", function () {
		it("works as expected for one confirmable", function () {
			const options = strategy.buildOptions(turn(confirmable, oneOff, confirmedSuspect), bot());
			expect(options).is.an("array").and.lengthOf(1);
			expect(options[0]).deep.equals(option());
		});

		it("works as expected for Baynes", function () {
			const options = strategy.buildOptions(turn(confirmable, oneOff, confirmedSuspect), bot(InspectorType.Baynes));
			expect(options).is.an("array").and.lengthOf(1);
			expect(options[0]).deep.equals(option(undefined, BotTurnEffectType.HolmesImpeded));
		});

		it("works as expected for Morstan", function () {
			const options = strategy.buildOptions(turn(confirmable, oneOff, confirmedSuspect), bot(InspectorType.Morstan));
			expect(options).is.an("array").and.lengthOf(2);
			expect(options).deep.includes.members([ option(LeadType.Opportunity), option(LeadType.Motive) ]);
		});

		it("marks potential losses", function () {
			const options = strategy.buildOptions(turn(confirmable, confirmedOpportunity, confirmedSuspect), bot());
			expect(options).is.an("array").and.lengthOf(1);
			expect(options[0]).deep.equals(option(undefined, BotTurnEffectType.Lose));
		});

		it("marks potential wins", function () {
			const options = strategy.buildOptions(turn(confirmable, confirmedOpportunity, confirmedSuspect, 20), bot());
			expect(options).is.an("array").and.lengthOf(1);
			expect(options[0]).deep.equals(option(undefined, BotTurnEffectType.Win));
		});
	});
});
