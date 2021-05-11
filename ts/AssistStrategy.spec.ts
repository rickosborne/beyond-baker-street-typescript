import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "./ActionType";
import { OtherCardKnowledge, OtherPlayerKnowledge } from "./askOtherPlayersAboutTheirHands";
import { AssistAction, AssistType, TypeAssistAction, ValueAssistAction } from "./AssistAction";
import {
	addUsualAssistEffects,
	AssistStrategy,
	AssistTurnOption,
	buildAssistsForCard,
	buildTypeAssistOption,
	buildValueAssistOption,
	compareAssistedImpacts,
	getPossibleAfterTypes,
	getPossibleAfterValues,
	isAssistTypeOption,
	isAssistValueOption,
	TypeAssistTurnOption,
	ValueAssistTurnOption,
} from "./AssistStrategy";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { LeadType } from "./LeadType";
import { OtherHand } from "./OtherHand";
import { OtherPlayer, Player } from "./Player";
import { reduceOptions } from "./reduceOptions";
import { TurnStart } from "./TurnStart";
import { VisibleLead } from "./VisibleBoard";

const strategy = new AssistStrategy();

function assisted(possibleBefore: number, possibleAfter: number): AssistAction {
	return <AssistAction> {
		possibleAfter,
		possibleBefore,
	};
}

function valueAssist(evidenceValue: EvidenceValue, possibleBefore: number, possibleAfter: number, ...effects: BotTurnEffectType[]): ValueAssistTurnOption {
	return <ValueAssistTurnOption>{
		action: {
			evidenceValue,
			possibleAfter,
			possibleBefore,
		},
		effects,
	};
}

function mockOption(): TypeAssistTurnOption {
	return <TypeAssistTurnOption>{
		action: <AssistAction>{
			actionType: ActionType.Assist,
		},
		effects: [] as BotTurnEffectType[],
	};
}

function playerNamed(name: string): OtherPlayer {
	return <OtherPlayer>{
		name,
	};
}


describe("AssistStrategy", function () {
	it("assists type and value when both are unknown", function () {
		const evidenceCard1: EvidenceCard = {
			cardType: CardType.Evidence,
			evidenceType: EvidenceType.Track,
			evidenceValue: 1,
		};
		const evidenceCard2: EvidenceCard = {
			cardType: CardType.Evidence,
			evidenceType: EvidenceType.Witness,
			evidenceValue: 3,
		};
		const options = strategy.buildOptions(<TurnStart>{
			askOtherPlayerAboutTheirHand: (otherPlayer: OtherPlayer): OtherHand => {
				expect(otherPlayer.name).equals("other");
				return {
					hand: [ {
						possibleCount: 3,
						possibleTypes: [ EvidenceType.Track, EvidenceType.Witness ],
						possibleValues: [ 1, 2 ],
					}, {
						possibleCount: 3,
						possibleTypes: [EvidenceType.Witness],
						possibleValues: [ 3, 4 ],
					} ],
				};
			},
			board: {
				holmesLocation: 5,
				leads: {
					[LeadType.Motive]: {
						badValue: 0,
						confirmed: false,
						evidenceValue: 0,
						leadCard: {
							evidenceTarget: 8,
							evidenceType: EvidenceType.Document,
						},
					},
					[LeadType.Opportunity]: {
						badValue: 0,
						confirmed: false,
						evidenceCards: [{
							evidenceType: EvidenceType.Track,
							evidenceValue: 6,
						}],
						evidenceValue: 6,
						leadCard: {
							evidenceTarget: 7,
							evidenceType: EvidenceType.Track,
						},
					},
					[LeadType.Suspect]: {
						badValue: 0,
						confirmed: false,
						evidenceValue: 0,
						leadCard: {
							evidenceTarget: 10,
							evidenceType: EvidenceType.Clue,
						},
					},
				},
			},
			nextPlayer: {
				name: "other",
			},
			otherPlayers: [{
				hand: [ evidenceCard1, evidenceCard2 ],
				name: "other",
			}],
			player: {
				name: "active",
			},
		});
		expect(options).has.length(2);
		const typeOption = options.filter(isAssistTypeOption)[0];
		expect(typeOption, "typeOption").is.not.null;
		expect(typeOption.action).includes(<TypeAssistAction>{
			evidenceType: evidenceCard1.evidenceType,
		});
		expect(typeOption.effects).has.members([ BotTurnEffectType.AssistNarrow, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistNextPlayer ]);
		const valueOption = options.filter(isAssistValueOption)[0];
		expect(valueOption, "valueOption").is.not.not.null;
		expect(valueOption.action).includes(<ValueAssistAction>{
			evidenceValue: evidenceCard2.evidenceValue,
		});
		expect(valueOption.effects).has.members([ BotTurnEffectType.AssistKnown, BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistNextPlayer ]);
	});

	describe("addUsualAssistEffects", function () {
		it("adds AssistNextPlayer if necessary", function () {
			const option: Partial<AssistTurnOption> = mockOption();
			const options: AssistTurnOption[] = [option as AssistTurnOption];
			addUsualAssistEffects(options, 2, playerNamed("second"), playerNamed("second"), 0, 20, 1);
			expect(options).has.length(1);
			expect(option.effects)
				.has.length(2).and
				.has.members([ BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistNextPlayer ]);
		});

		it("adds Lose if Holmes would win", function () {
			const option: Partial<AssistTurnOption> = mockOption();
			const options: AssistTurnOption[] = [option as AssistTurnOption];
			addUsualAssistEffects(options, 1, playerNamed("second"), playerNamed("third"), 0, 20, 1);
			expect(options).has.length(1);
			expect(option.effects)
				.has.length(2).and
				.has.members([ BotTurnEffectType.HolmesProgress, BotTurnEffectType.Lose ]);
		});

		it("does not add lose if Holmes is far enough away", function () {
			const option: Partial<AssistTurnOption> = <TypeAssistTurnOption>{
				action: <AssistAction>{
					actionType: ActionType.Assist,
				},
				effects: [] as BotTurnEffectType[],
			};
			const options: AssistTurnOption[] = [option as AssistTurnOption];
			addUsualAssistEffects(options, 2, playerNamed("second"), playerNamed("third"), 0, 20, 1);
			expect(option.effects).deep.equals([BotTurnEffectType.HolmesProgress]);
		});

		it("adds AssistExactEliminate if necessary", function () {
			const option: Partial<AssistTurnOption> = mockOption();
			const options: AssistTurnOption[] = [option as AssistTurnOption];
			addUsualAssistEffects(options, 2, playerNamed("second"), playerNamed("third"), 0, 1, 1);
			expect(options).has.length(1);
			expect(option.effects)
				.has.length(2).and
				.has.members([ BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistExactEliminate ]);
		});
	});

	describe("compareAssistedImpacts", function () {
		it("looks at the known first", function () {
			expect(compareAssistedImpacts(assisted(2, 1), assisted(50, 2))).lessThan(0);
			expect(compareAssistedImpacts(assisted(50, 2), assisted(2, 1))).greaterThan(0);
		});

		it("looks at possibleAfter if neither is known", function () {
			expect(compareAssistedImpacts(assisted(3, 2), assisted(50, 3))).lessThan(0);
			expect(compareAssistedImpacts(assisted(50, 3), assisted(3, 2))).greaterThan(0);
		});

		it("looks at possibleBefore if possibleAfter is the same", function () {
			expect(compareAssistedImpacts(assisted(50, 2), assisted(4, 2))).lessThan(0);
			expect(compareAssistedImpacts(assisted(4, 2), assisted(50, 2))).greaterThan(0);
		});
	});

	describe("reduceOptions+compareAssistedImpacts", function () {
		it("leaves only the best options with matching effects", function () {
			const optionsBefore: AssistTurnOption[] = [
				valueAssist(1, 8, 7, BotTurnEffectType.AssistImpossibleType),
				valueAssist(2, 2, 1, BotTurnEffectType.AssistKnown),
				valueAssist(3, 3, 2, BotTurnEffectType.AssistNarrow, BotTurnEffectType.AssistNextPlayer),
				valueAssist(4, 4, 1, BotTurnEffectType.AssistKnown),
				valueAssist(5, 5, 2, BotTurnEffectType.AssistNarrow, BotTurnEffectType.AssistNextPlayer),
				valueAssist(6, 8, 3, BotTurnEffectType.AssistImpossibleType),
			];
			const optionsAfter = reduceOptions(optionsBefore, compareAssistedImpacts);
			expect(optionsAfter).lengthOf(3);
			const known = optionsAfter.filter(o => o.effects.includes(BotTurnEffectType.AssistKnown));
			expect(known).lengthOf(1);
			expect(known[0].action).includes({ evidenceValue: 4 });
			const narrow = optionsAfter.filter(o => o.effects.includes(BotTurnEffectType.AssistNarrow));
			expect(narrow).lengthOf(1);
			expect(narrow[0].action).includes({ evidenceValue: 5 });
			const impossible = optionsAfter.filter(o => o.effects.includes(BotTurnEffectType.AssistImpossibleType));
			expect(impossible).lengthOf(1);
			expect(impossible[0].action).includes({ evidenceValue: 6 });
		});
	});

	describe("getPossibleAfterValues", function () {
		const knowledge = <OtherPlayerKnowledge>{
			knowledge: <OtherCardKnowledge[]>[
				{
					unknownCard: {
						possibleCount: 8,
						possibleValues: [ 1, 2, 3, 4 ],
					},
				}, {
					unknownCard: {
						possibleCount: 9,
						possibleValues: [ 2, 3, 4 ],
					},
				},
			],
		};
		expect(getPossibleAfterValues(knowledge, 1)).equals(2 + 9);
		expect(getPossibleAfterValues(knowledge, 2)).equals(2 + 3);
		expect(getPossibleAfterValues(knowledge, 5)).equals(8 + 9);
	});

	describe("getPossibleAfterTypes", function () {
		const knowledge = <OtherPlayerKnowledge>{
			knowledge: <OtherCardKnowledge[]>[
				{
					unknownCard: {
						possibleCount: 9,
						possibleTypes: [ EvidenceType.Witness, EvidenceType.Track, EvidenceType.Clue ],
					},
				}, {
					unknownCard: {
						possibleCount: 8,
						possibleTypes: [ EvidenceType.Track, EvidenceType.Clue ],
					},
				},
			],
		};
		expect(getPossibleAfterTypes(knowledge, EvidenceType.Witness)).equals(3 + 8);
		expect(getPossibleAfterTypes(knowledge, EvidenceType.Track)).equals(3 + 4);
		expect(getPossibleAfterTypes(knowledge, EvidenceType.Document)).equals(9 + 8);
	});

	describe("buildValueAssistOption", function () {
		const knowledge = <OtherPlayerKnowledge>{
			knowledge: <OtherCardKnowledge[]>[{
				unknownCard: {
					possibleCount: 8,
					possibleValues: [ 1, 2, 3, 4 ],
				},
			}],
		};

		it("handles unknown types", function () {
			const unknownType = buildValueAssistOption(knowledge, 2, 8, false, playerNamed("other"), []);
			expect(unknownType).includes({ assistType: AssistType.Value, evidenceValue: 2, strategyType: BotTurnStrategyType.Assist });
			expect(unknownType.action).deep.includes({ actionType: ActionType.Assist, assistType: AssistType.Value, evidenceValue: 2, player: { name: "other" }, possibleAfter: 2, possibleBefore: 8 });
			expect(unknownType.effects)
				.does.include(BotTurnEffectType.AssistNarrow).and
				.does.not.include(BotTurnEffectType.AssistKnown);
		});

		it("handles known types", function () {
			const knownType = buildValueAssistOption(knowledge, 6, 8, true, playerNamed("other"), []);
			expect(knownType).includes({ assistType: AssistType.Value, evidenceValue: 6, strategyType: BotTurnStrategyType.Assist });
			expect(knownType.action).deep.includes({ actionType: ActionType.Assist, assistType: AssistType.Value, evidenceValue: 6, player: { name: "other" }, possibleAfter: 8, possibleBefore: 8 });
			expect(knownType.effects)
				.does.include(BotTurnEffectType.AssistKnown).and
				.does.not.include(BotTurnEffectType.AssistNarrow);
		});
	});

	describe("buildTypeAssistOption", function () {
		const knowledge = <OtherPlayerKnowledge>{
			knowledge: <OtherCardKnowledge[]>[{
				unknownCard: {
					possibleCount: 9,
					possibleTypes: [ EvidenceType.Witness, EvidenceType.Track, EvidenceType.Clue ],
				},
			}],
		};

		it("handles unknown values", function () {
			const unknownValue = buildTypeAssistOption(knowledge, EvidenceType.Track, 9, 1, false, playerNamed("other"), []);
			expect(unknownValue).includes({ assistType: AssistType.Type, evidenceType: EvidenceType.Track, strategyType: BotTurnStrategyType.Assist });
			expect(unknownValue.action).deep.includes({ actionType: ActionType.Assist, assistType: AssistType.Type, evidenceType: EvidenceType.Track, player: { name: "other" }, possibleAfter: 3, possibleBefore: 9 });
			expect(unknownValue.effects)
				.does.include(BotTurnEffectType.AssistNarrow).and
				.does.not.include.members([ BotTurnEffectType.AssistKnown, BotTurnEffectType.AssistImpossibleType ]);
		});

		it("handles known values", function () {
			const knownValue = buildTypeAssistOption(knowledge, EvidenceType.Track, 9, 1, true, playerNamed("other"), []);
			expect(knownValue).includes({ assistType: AssistType.Type, evidenceType: EvidenceType.Track, strategyType: BotTurnStrategyType.Assist });
			expect(knownValue.action).deep.includes({ actionType: ActionType.Assist, assistType: AssistType.Type, evidenceType: EvidenceType.Track, player: { name: "other" }, possibleAfter: 3, possibleBefore: 9 });
			expect(knownValue.effects)
				.does.include(BotTurnEffectType.AssistKnown).and
				.does.not.include.members([ BotTurnEffectType.AssistNarrow, BotTurnEffectType.AssistImpossibleType ]);
		});

		it("handles impossible types", function () {
			const impossible = buildTypeAssistOption(knowledge, EvidenceType.Track, 9, 0, true, playerNamed("other"), []);
			expect(impossible).includes({ assistType: AssistType.Type, evidenceType: EvidenceType.Track, strategyType: BotTurnStrategyType.Assist });
			expect(impossible.action).deep.includes({ actionType: ActionType.Assist, assistType: AssistType.Type, evidenceType: EvidenceType.Track, player: { name: "other" }, possibleAfter: 3, possibleBefore: 9 });
			expect(impossible.effects)
				.does.include.members([ BotTurnEffectType.AssistKnown, BotTurnEffectType.AssistImpossibleType ]).and
				.does.not.include(BotTurnEffectType.AssistNarrow);
		});
	});

	describe("buildAssistsForCard", function () {
		const turn = <TurnStart> {
			board: {
				holmesLocation: 7,
				investigationMarker: 19,
			},
			nextPlayer: playerNamed("next") as Player,
		};

		it("does not try to assist if the other player already knows the card", function () {
			const cardKnowledge = <OtherCardKnowledge> {
				evidenceCard: {
					evidenceType: EvidenceType.Track,
					evidenceValue: 1,
				},
				handIndex: 0,
				unknownCard: {
					possibleCount: 1,
					possibleTypes: [EvidenceType.Track],
					possibleValues: [6],
				},
			};
			const options = buildAssistsForCard(cardKnowledge, undefined as unknown as OtherPlayerKnowledge, <VisibleLead[]> [], turn);
			expect(options).lengthOf(0);
		});

		it("builds type assist options when appropriate", function () {
			const cardKnowledge = <OtherCardKnowledge> {
				evidenceCard: {
					evidenceType: EvidenceType.Track,
					evidenceValue: 1,
				},
				handIndex: 0,
				unknownCard: {
					possibleCount: 2,
					possibleTypes: [ EvidenceType.Track, EvidenceType.Witness ],
					possibleValues: [1],
				},
			};
			const playerKnowledge = <OtherPlayerKnowledge> {
				knowledge: [cardKnowledge],
				otherPlayer: playerNamed("other"),
			};
			const options = buildAssistsForCard(cardKnowledge, playerKnowledge, <VisibleLead[]> [], turn);
			expect(options).lengthOf(1);
			const type = options[0];
			expect(type.action).includes({ evidenceType: EvidenceType.Track });
			expect(type.effects).has.members([ BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistKnown, BotTurnEffectType.AssistExactEliminate, BotTurnEffectType.AssistImpossibleType ]);
		});

		it("builds value assist options when appropriate", function () {
			const cardKnowledge = <OtherCardKnowledge> {
				evidenceCard: {
					evidenceType: EvidenceType.Track,
					evidenceValue: 1,
				},
				handIndex: 0,
				unknownCard: {
					possibleCount: 2,
					possibleTypes: [EvidenceType.Track],
					possibleValues: [ 1, 6 ],
				},
			};
			const playerKnowledge = <OtherPlayerKnowledge> {
				knowledge: [cardKnowledge],
				otherPlayer: playerNamed("other"),
			};
			const options = buildAssistsForCard(cardKnowledge, playerKnowledge, <VisibleLead[]> [], turn);
			expect(options).lengthOf(1);
			const value = options[0];
			expect(value.action).includes({ evidenceValue: 1 });
			expect(value.effects).has.members([ BotTurnEffectType.HolmesProgress, BotTurnEffectType.AssistKnown, BotTurnEffectType.AssistExactEliminate ]);
		});
	});
});
