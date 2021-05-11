import { expect } from "chai";
import { describe, it } from "mocha";
import { BotTurnEffectType } from "./BotTurn";
import { CaseFileCard } from "./CaseFileCard";
import { compileEffectWeight, EffectWeightOp, EffectWeightOperand, EffectWeightOperator } from "./EffectWeight";
import { EVIDENCE_CARD_VALUE_MAX } from "./EvidenceCard";
import { HOLMES_MAX } from "./Game";
import { LeadType } from "./LeadType";
import { randomInt } from "./rng";
import { roundTo } from "./roundTo";
import { TurnStart } from "./TurnStart";
import { VisibleBoard, VisibleLead } from "./VisibleBoard";

const NO_EFFECT: BotTurnEffectType = undefined as unknown as BotTurnEffectType;
const NO_TURN: TurnStart = undefined as unknown as TurnStart;

function testBoth(
	ops: EffectWeightOp[],
	expectedValue: number,
	expectedFormat: string,
	effect = NO_EFFECT,
	turn = NO_TURN,
): void {
	const calculator = compileEffectWeight(ops, BotTurnEffectType.Win);
	const value = calculator.calculate(effect, turn);
	const readable = calculator.format(effect, turn);
	expect(value, "value").equals(expectedValue);
	expect(readable, "readable").equals(expectedFormat);
}

function binaryTestBoth(op: EffectWeightOperator, math: (a: number, b: number) => number, opText: string): void {
	const a = randomInt();
	const b = randomInt();
	testBoth([ a, b, op ], math(a, b), `(${a})${opText}(${b})`);
}

function unaryTestBoth(op: EffectWeightOperator, math: (a: number) => number, format: (a: string) => string): void {
	const a = randomInt();
	testBoth([ a, op ], math(a), format(String(a)));
}


const SOME_CONFIRMED = <TurnStart>{
	board: <VisibleBoard>{
		leads: {
			[LeadType.Motive]: <VisibleLead>{
				confirmed: false,
			},
			[LeadType.Opportunity]: <VisibleLead>{
				confirmed: true,
			},
			[LeadType.Suspect]: <VisibleLead>{
				confirmed: true,
			},
		},
	},
};

describe("compileEffectWeight", function () {
	it("handles single numbers", function () {
		const weight = randomInt();
		testBoth([weight], weight, String(weight));
	});

	it("handles basic addition", function () {
		binaryTestBoth(EffectWeightOperator.Add, (a, b) => a + b, "+");
	});

	it("handles basic division", function () {
		binaryTestBoth(EffectWeightOperator.Divide, (a, b) => a / b, "/");
	});

	it("handles basic multiplication", function () {
		binaryTestBoth(EffectWeightOperator.Multiply, (a, b) => a * b, "*");
	});

	it("handles basic subtraction", function () {
		binaryTestBoth(EffectWeightOperator.Subtract, (a, b) => a - b, "-");
	});

	it("handles inverse", function () {
		unaryTestBoth(EffectWeightOperator.Invert, a => 1 / a, a => `1/(${a})`);
	});

	it("handles negation", function () {
		unaryTestBoth(EffectWeightOperator.Negate, a => 0 - a, a => `0-(${a})`);
	});

	it("handles reverse", function () {
		unaryTestBoth(EffectWeightOperator.Reverse, a => 1 - a, a => `1-(${a})`);
	});

	it("handles ConfirmedLeads", function () {
		testBoth([EffectWeightOperand.ConfirmedLeads], 2, "2", NO_EFFECT, SOME_CONFIRMED);
	});

	it("handles EvidenceValueMax", function () {
		testBoth([EffectWeightOperand.EvidenceValueMax], EVIDENCE_CARD_VALUE_MAX, String(EVIDENCE_CARD_VALUE_MAX));
	});

	it("handles HolmesLocation", function () {
		const holmesLocation = randomInt();
		testBoth([EffectWeightOperand.HolmesLocation], holmesLocation, String(holmesLocation), NO_EFFECT, <TurnStart>{
			board: <VisibleBoard>{
				holmesLocation,
			},
		});
	});

	it("handles HolmesProgress", function () {
		const holmesLocation = randomInt(HOLMES_MAX);
		const holmesProgress = (HOLMES_MAX - holmesLocation) / HOLMES_MAX;
		testBoth([EffectWeightOperand.HolmesProgress], holmesProgress, String(roundTo(holmesProgress, 2)), NO_EFFECT, <TurnStart>{
			board: <VisibleBoard>{
				holmesLocation,
			},
		});
	});

	it("handles ImpossibleCount", function () {
		const impossibleCount = randomInt();
		testBoth([EffectWeightOperand.ImpossibleCount], impossibleCount, String(impossibleCount), NO_EFFECT, <TurnStart>{
			board: <VisibleBoard>{
				impossibleCards: new Array(impossibleCount),
			},
		});
	});

	it("handles ImpossiblePastLimit", function () {
		const impossibleTarget = randomInt(5, 1);
		const impossibleOver = randomInt(5, 1);
		const impossibleCount = impossibleTarget + impossibleOver;
		testBoth([EffectWeightOperand.ImpossiblePastLimit], impossibleOver, String(impossibleOver), NO_EFFECT, <TurnStart>{
			board: <VisibleBoard>{
				caseFile: <CaseFileCard>{
					impossibleLimit: impossibleTarget,
				},
				impossibleCards: new Array(impossibleCount),
				impossibleLimit: impossibleTarget,
			},
		});
	});

	it("handles RemainingCount", function () {
		const remainingEvidenceCount = randomInt();
		testBoth([EffectWeightOperand.RemainingCount], remainingEvidenceCount, String(remainingEvidenceCount), NO_EFFECT, <TurnStart>{
			board: <VisibleBoard>{
				remainingEvidenceCount,
			},
		});
	});

	it("handles UnconfirmedLeads", function () {
		testBoth([EffectWeightOperand.UnconfirmedLeads], 1, "1", NO_EFFECT, SOME_CONFIRMED);
	});
});
