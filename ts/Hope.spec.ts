import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { AssistAction, AssistType, TypeAssistAction, ValueAssistAction } from "./AssistAction";
import { AssistTurnOption } from "./AssistStrategy";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { buildHopeOptionForActions, HopeInspectorStrategy, HopeOption, unifyEffectsForAssists } from "./Hope";
import { Player } from "./Player";

function playerNamed(name: string): Player {
	return {
		name,
	};
}

function typeAssistAction(
	evidenceType: EvidenceType = EvidenceType.Track,
	player: Player = playerNamed("typePlayer"),
): AssistAction {
	return <TypeAssistAction>{
		actionType: ActionType.Assist,
		assistType: AssistType.Type,
		evidenceType,
		player,
	};
}
function valueAssistAction(
	evidenceValue: EvidenceValue = 6,
	player: Player = playerNamed("valuePlayer"),
): ValueAssistAction {
	return <ValueAssistAction> {
		actionType: ActionType.Assist,
		assistType: AssistType.Value,
		evidenceValue,
		player,
	};
}

function wrapOption(
	action: AssistAction,
	effects: BotTurnEffectType[] = [],
): AssistTurnOption {
	return {
		action,
		assistType: action.assistType,
		effects,
		strategyType: BotTurnStrategyType.Assist,
	};
}

const strategy = new HopeInspectorStrategy();
const typeOption = wrapOption(typeAssistAction(), [ BotTurnEffectType.AssistImpossibleType, BotTurnEffectType.AssistKnown, BotTurnEffectType.HolmesProgress ]);
const valueOption = wrapOption(valueAssistAction(), [ BotTurnEffectType.AssistKnown, BotTurnEffectType.HolmesProgress ]);

describe("HopeInspectorStrategy", function () {
	describe("processOptions", function () {
		it("does not touch single-assist options", function () {
			const options: BotTurnOption[] = [typeOption];
			strategy.processOptions(options);
			expect(options).lengthOf(1);
			expect(options[0]).deep.includes({ strategyType: BotTurnStrategyType.Assist });
		});

		it("adds options for pairs", function () {
			const t1 = wrapOption(typeAssistAction(), [ BotTurnEffectType.AssistNextPlayer, BotTurnEffectType.AssistImpossibleType, BotTurnEffectType.HolmesProgress ]);
			const v1 = wrapOption(valueAssistAction(), [ BotTurnEffectType.AssistExactEliminate, BotTurnEffectType.HolmesProgress ]);
			const t2 = wrapOption(typeAssistAction(), [ BotTurnEffectType.AssistNextPlayer, BotTurnEffectType.HolmesProgress ]);
			const v2 = wrapOption(valueAssistAction(), [ BotTurnEffectType.AssistKnown, BotTurnEffectType.HolmesProgress ]);
			const options: BotTurnOption[] = [ t1, v1, t2, v2 ];
			strategy.processOptions(options);
			const assistOptions = options.filter(o => o.strategyType === BotTurnStrategyType.Assist);
			expect(assistOptions).has.members([ t1, v1, t2, v2 ]);
			const hopes = options.filter(o => o.strategyType === BotTurnStrategyType.Inspector && o.action.actionType === ActionType.Hope) as HopeOption[];
			expect(hopes).lengthOf(6);
			expect(hopes.filter(o => o.action.assists[0] === t1.action && o.action.assists[1] === v1.action)[0].effects).has.members([ BotTurnEffectType.AssistNextPlayer, BotTurnEffectType.AssistImpossibleType, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistExactEliminate ]);
			expect(hopes.filter(o => o.action.assists[0] === t1.action && o.action.assists[1] === t2.action)[0].effects).has.members([ BotTurnEffectType.AssistNextPlayer, BotTurnEffectType.AssistImpossibleType, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistNextPlayer ]);
			expect(hopes.filter(o => o.action.assists[0] === t1.action && o.action.assists[1] === v2.action)[0].effects).has.members([ BotTurnEffectType.AssistNextPlayer, BotTurnEffectType.AssistImpossibleType, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistKnown ]);
			expect(hopes.filter(o => o.action.assists[0] === v1.action && o.action.assists[1] === t2.action)[0].effects).has.members([ BotTurnEffectType.AssistExactEliminate, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistNextPlayer ]);
			expect(hopes.filter(o => o.action.assists[0] === v1.action && o.action.assists[1] === v2.action)[0].effects).has.members([ BotTurnEffectType.AssistExactEliminate, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistKnown ]);
			expect(hopes.filter(o => o.action.assists[0] === t2.action && o.action.assists[1] === v2.action)[0].effects).has.members([ BotTurnEffectType.AssistNextPlayer, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistKnown ]);
		});
	});

	describe("unifyEffectsForAssists", function () {
		it("combines effects", function () {
			const effects = unifyEffectsForAssists([ typeOption, valueOption ]);
			expect(effects).includes.members([ BotTurnEffectType.AssistImpossibleType, BotTurnEffectType.AssistKnown, BotTurnEffectType.HolmesProgress ])
				.and.lengthOf(4);
			expect(effects.filter(e => e === BotTurnEffectType.HolmesProgress)).lengthOf(1);
			expect(effects.filter(e => e === BotTurnEffectType.AssistKnown)).lengthOf(2);
		});
	});

	describe("buildHopeOptionForActions", function () {
		it("does what it says", function () {
			const option = buildHopeOptionForActions([ typeAssistAction(), valueAssistAction() ], [ BotTurnEffectType.AssistKnown, BotTurnEffectType.HolmesProgress ]);
			expect(option).deep.includes({
				action: {
					actionType: ActionType.Hope,
					assists: [ {
						actionType: ActionType.Assist,
						assistType: AssistType.Type,
						evidenceType: EvidenceType.Track,
						player: {
							name: "typePlayer",
						},
					}, {
						actionType: ActionType.Assist,
						assistType: AssistType.Value,
						evidenceValue: 6,
						player: {
							name: "valuePlayer",
						},
					} ],
				},
				effects: [ BotTurnEffectType.AssistKnown, BotTurnEffectType.HolmesProgress ],
				strategyType: BotTurnStrategyType.Inspector,
			});
		});
	});
});
