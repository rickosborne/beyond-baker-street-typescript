import { expect } from "chai";
import { describe, it } from "mocha";
import {
	compileEffectWeight, EffectWeightFormula, EffectWeightModifier,
	holmesProgress,
	impossiblePastLimit,
	investigationProgress,
	rampWithProgress,
	remainingProgress,
} from "./EffectWeight";
import { EVIDENCE_CARDS } from "./EvidenceCard";
import { HOLMES_GOAL, HOLMES_MAX, INVESTIGATION_MARKER_GOAL } from "./Game";
import { roundTo } from "./roundTo";
import { TurnStart } from "./TurnStart";

function turnInvestigation(
	investigationMarker: number,
): TurnStart {
	return <TurnStart> {
		board: {
			investigationMarker,
		},
	};
}

function turnRemain(
	remainingEvidenceCount: number,
): TurnStart {
	return <TurnStart> {
		board: {
			remainingEvidenceCount,
		},
	};
}

function turnImpossible(
	impossibleCount: number,
	impossibleLimit = 4,
): TurnStart {
	return <TurnStart> {
		board: {
			impossibleCards: new Array(impossibleCount),
			impossibleLimit,
		},
	};
}

function turnHolmes(
	holmesLocation: number,
): TurnStart {
	return <TurnStart> {
		board: {
			holmesLocation,
		},
	};
}

describe("EffectWeight", function () {
	describe("remainingProgress", function () {
		for (let i = 0; i <= INVESTIGATION_MARKER_GOAL; i++) {
			it(`does not return zero given ${i}`, function () {
					expect(investigationProgress(turnInvestigation(i))).does.not.equal(0);
					expect(investigationProgress(turnInvestigation(i), true)).does.not.equal(0);
			});
		}
		it("goes to 1", function () {
			expect(investigationProgress(turnInvestigation(INVESTIGATION_MARKER_GOAL))).equals(1);
		});
		it("combines with ramp", function () {
			expect(rampWithProgress(10, investigationProgress(turnInvestigation(INVESTIGATION_MARKER_GOAL), false, true))).equals(10);
			expect(rampWithProgress(10, investigationProgress(turnInvestigation(10), false, true))).equals(0);
			expect(rampWithProgress(10, investigationProgress(turnInvestigation(0), false, true))).equals(-10);
			expect(rampWithProgress(10, investigationProgress(turnInvestigation(INVESTIGATION_MARKER_GOAL), true, true))).equals(-10);
			expect(rampWithProgress(10, investigationProgress(turnInvestigation(10), true, true))).equals(0);
			expect(rampWithProgress(10, investigationProgress(turnInvestigation(0), true, true))).equals(10);
		});
	});
	describe("remainingProgress", function () {
		for (let r = 0; r < EVIDENCE_CARDS.length; r++) {
			it(`does not return zero given ${r}`, function () {
				expect(remainingProgress(turnRemain(r))).does.not.equal(0);
				expect(remainingProgress(turnRemain(r), true)).does.not.equal(0);
			});
		}
	});
	describe("holmesProgress", function () {
		for (let h = HOLMES_GOAL; h <= HOLMES_MAX; h++) {
			it(`does not return zero given ${h}`, function () {
				expect(holmesProgress(turnHolmes(h))).greaterThan(0);
				expect(holmesProgress(turnHolmes(h), true)).greaterThan(0);
			});
		}
	});
	describe("impossiblePastLimit", function () {
		for (let i = 0; i <= 4; i++) {
			it(`does not return less than zero given ${i}`, function () {
				expect(impossiblePastLimit(turnImpossible(i))).equals(0);
			});
		}
		for (let i = 5; i <= 8; i++) {
			it(`returns count minus limit given ${i}`, function () {
				expect(impossiblePastLimit(turnImpossible(i, 4))).equals(i - 4);
			});
		}
	});
	describe("compileEffectWeight", function () {
		it("throws for bogus", function () {
			expect(() => compileEffectWeight([] as unknown as EffectWeightFormula)).throws("No ops for effectWeight");
		});
		it("handles no formula", function () {
			expect(compileEffectWeight([10])(turnHolmes(3))).equals(10);
		});

		([
			[ 0, 10, EffectWeightModifier.MinusHolmesLocation, turnHolmes(7), 3 ],
			[ 0, 10, EffectWeightModifier.MinusImpossibleCount, turnImpossible(3), 7 ],
			[ 0, 10, EffectWeightModifier.MinusImpossiblePastLimit, turnImpossible(1, 1), 10 ],
			[ 0, 10, EffectWeightModifier.MinusImpossiblePastLimit, turnImpossible(3, 1), 8 ],
			[ 0, 10, EffectWeightModifier.MinusInvestigationMarker, turnInvestigation(4), 6 ],
			[ 0, 10, EffectWeightModifier.MinusRemainingCount, turnRemain(6), 4 ],
			[ 0, 10, EffectWeightModifier.OverHolmesLocation, turnHolmes(4), 2 ],
			[ 0, 10, EffectWeightModifier.OverHolmesProgress, turnHolmes(8), 20 ],
			[ 0, 10, EffectWeightModifier.OverHolmesProgressReversed, turnHolmes(3), 40 ],
			[ 0, 10, EffectWeightModifier.OverImpossibleCount, turnImpossible(0), 10 ],
			[ 0, 10, EffectWeightModifier.OverImpossibleCount, turnImpossible(4), 2 ],
			[ 0, 10, EffectWeightModifier.OverImpossiblePastLimit, turnImpossible(0, 4), 10 ],
			[ 0, 10, EffectWeightModifier.OverImpossiblePastLimit, turnImpossible(4, 4), 10 ],
			[ 0, 10, EffectWeightModifier.OverImpossiblePastLimit, turnImpossible(5, 4), 5 ],
			[ 0, 10, EffectWeightModifier.OverImpossiblePastLimit, turnImpossible(7, 4), 2.5 ],
			[ 0, 10, EffectWeightModifier.OverInvestigationProgress, turnInvestigation(0), 210 ],
			[ 0, 10, EffectWeightModifier.OverInvestigationProgress, turnInvestigation(INVESTIGATION_MARKER_GOAL), 10 ],
			[ 0, 10, EffectWeightModifier.OverInvestigationProgressReversed, turnInvestigation(0), 10 ],
			[ 0, 10, EffectWeightModifier.OverInvestigationProgressReversed, turnInvestigation(INVESTIGATION_MARKER_GOAL), 210 ],
			[ 0, 10, EffectWeightModifier.OverRemainingCount, turnRemain(0), 10 ],
			[ 0, 10, EffectWeightModifier.OverRemainingCount, turnRemain(1), 5 ],
			[ 0, 10, EffectWeightModifier.OverRemainingCount, turnRemain(9), 1 ],
			[ 0, 10, EffectWeightModifier.OverRemainingProgress, turnRemain(0), 10 ],
			[ 0, 10, EffectWeightModifier.OverRemainingProgress, turnRemain(EVIDENCE_CARDS.length), 250 ],
			[ 0, 10, EffectWeightModifier.OverRemainingProgressReversed, turnRemain(0), 250 ],
			[ 0, 10, EffectWeightModifier.OverRemainingProgressReversed, turnRemain(EVIDENCE_CARDS.length), 10 ],
			[ 0, 10, EffectWeightModifier.PlusHolmesLocation, turnHolmes(7), 17 ],
			[ 0, 10, EffectWeightModifier.PlusImpossibleCount, turnImpossible(3), 13 ],
			[ 0, 10, EffectWeightModifier.PlusImpossiblePastLimit, turnImpossible(1, 1), 10 ],
			[ 0, 10, EffectWeightModifier.PlusImpossiblePastLimit, turnImpossible(3, 1), 12 ],
			[ 0, 10, EffectWeightModifier.PlusInvestigationMarker, turnInvestigation(4), 14 ],
			[ 0, 10, EffectWeightModifier.PlusRemainingCount, turnRemain(6), 16 ],
			[ 0, 10, EffectWeightModifier.RampDownWithHolmesProgress, turnHolmes(HOLMES_MAX), 10 ],
			[ 0, 10, EffectWeightModifier.RampDownWithHolmesProgress, turnHolmes(6), -2 ],
			[ 0, 10, EffectWeightModifier.RampDownWithHolmesProgress, turnHolmes(0), -10 ],
			[ 0, 10, EffectWeightModifier.RampDownWithInvestigationProgress, turnInvestigation(0), 10 ],
			[ 0, 10, EffectWeightModifier.RampDownWithInvestigationProgress, turnInvestigation(10), 0 ],
			[ 0, 10, EffectWeightModifier.RampDownWithInvestigationProgress, turnInvestigation(INVESTIGATION_MARKER_GOAL), -10 ],
			[ 0, 10, EffectWeightModifier.RampUpWithHolmesProgress, turnHolmes(HOLMES_MAX), -10 ],
			[ 0, 10, EffectWeightModifier.RampUpWithHolmesProgress, turnHolmes(6), 2 ],
			[ 0, 10, EffectWeightModifier.RampUpWithHolmesProgress, turnHolmes(0), 10 ],
			[ 0, 10, EffectWeightModifier.RampUpWithInvestigationProgress, turnInvestigation(0), -10 ],
			[ 0, 10, EffectWeightModifier.RampUpWithInvestigationProgress, turnInvestigation(10), 0 ],
			[ 0, 10, EffectWeightModifier.RampUpWithInvestigationProgress, turnInvestigation(INVESTIGATION_MARKER_GOAL), 10 ],
			[ 0, 10, EffectWeightModifier.TimesHolmesProgress, turnHolmes(9), 4 ],
			[ 0, 10, EffectWeightModifier.TimesHolmesProgressReversed, turnHolmes(3), 2 ],
			[ 0, 10, EffectWeightModifier.TimesImpossiblePastLimit, turnImpossible(0, 4), 0 ],
			[ 0, 10, EffectWeightModifier.TimesImpossiblePastLimit, turnImpossible(4, 4), 0 ],
			[ 0, 10, EffectWeightModifier.TimesImpossiblePastLimit, turnImpossible(5, 4), 10 ],
			[ 0, 10, EffectWeightModifier.TimesImpossiblePastLimit, turnImpossible(7, 4), 30 ],
			[ 0, 10, EffectWeightModifier.TimesInvestigationProgress, turnInvestigation(0), 0 ],
			[ 0, 10, EffectWeightModifier.TimesInvestigationProgress, turnInvestigation(INVESTIGATION_MARKER_GOAL), 10 ],
			[ 0, 10, EffectWeightModifier.TimesInvestigationProgressReversed, turnInvestigation(0), 10 ],
			[ 0, 10, EffectWeightModifier.TimesInvestigationProgressReversed, turnInvestigation(INVESTIGATION_MARKER_GOAL), 0 ],
			[ 0, 10, EffectWeightModifier.TimesRemainingProgress, turnRemain(0), 10 ],
			[ 0, 10, EffectWeightModifier.TimesRemainingProgress, turnRemain(EVIDENCE_CARDS.length), 0 ],
			[ 0, 10, EffectWeightModifier.TimesRemainingProgressReversed, turnRemain(0), 0 ],
			[ 0, 10, EffectWeightModifier.TimesRemainingProgressReversed, turnRemain(EVIDENCE_CARDS.length), 10 ],
		] as [number, number, EffectWeightModifier, TurnStart, number][]).forEach(([ base, offset, modifier, turn, expected ]) => {
			it(`handles ${base} ${modifier} ${JSON.stringify(turn.board)} => ${expected}`, function () {
				expect(roundTo(compileEffectWeight([ base, offset, modifier ])(turn), 1)).equals(expected);
			});
		});
	});
});
