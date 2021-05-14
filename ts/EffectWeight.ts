import { EVIDENCE_CARDS } from "./EvidenceCard";
import { BiFunction } from "./Function";
import { HOLMES_MAX, INVESTIGATION_MARKER_GOAL } from "./Game";
import { TurnStart } from "./TurnStart";
import { HasVisibleBoard } from "./VisibleBoard";

export enum EffectWeightModifier {
	MinusHolmesLocation = "MinusHolmesLocation",
	MinusImpossibleCount = "MinusImpossibleCount",
	MinusImpossiblePastLimit = "MinusImpossiblePastLimit",
	MinusInvestigationMarker = "MinusInvestigationMarker",
	MinusRemainingCount = "MinusRemainingCount",
	OverHolmesLocation = "OverHolmesLocation",
	OverHolmesProgress = "OverHolmesProgress",
	OverHolmesProgressReversed = "OverHolmesProgressReversed",
	OverImpossibleCount = "OverImpossibleCount",
	OverImpossiblePastLimit = "OverImpossiblePastLimit",
	OverInvestigationProgress = "OverInvestigationProgress",
	OverInvestigationProgressReversed = "OverInvestigationProgressReversed",
	OverRemainingCount = "OverRemainingCount",
	OverRemainingProgress = "OverRemainingProgress",
	OverRemainingProgressReversed = "OverRemainingProgressReversed",
	PlusHolmesLocation = "PlusHolmesLocation",
	PlusImpossibleCount = "PlusImpossibleCount",
	PlusImpossiblePastLimit = "PlusImpossiblePastLimit",
	PlusInvestigationMarker = "PlusInvestigationMarker",
	PlusRemainingCount = "PlusRemainingCount",
	RampDownWithHolmesProgress = "RampDownWithHolmesProgress",
	RampDownWithInvestigationProgress = "RampDownWithInvestigationProgress",
	RampUpWithHolmesProgress = "RampUpWithHolmesProgress",
	RampUpWithInvestigationProgress = "RampUpWithInvestigationProgress",
	TimesHolmesProgress = "TimesHolmesProgress",
	TimesHolmesProgressReversed = "TimesHolmesProgressReversed",
	TimesImpossiblePastLimit = "TimesImpossiblePastLimit",
	TimesInvestigationProgress = "TimesInvestigationProgress",
	TimesInvestigationProgressReversed = "TimesInvestigationProgressReversed",
	TimesRemainingProgress = "TimesRemainingProgress",
	TimesRemainingProgressReversed = "TimesRemainingProgressReversed",
}

export type EffectWeightFormula = [number] | [ number, EffectWeightModifier ];

export function investigationProgress(turnStart: HasVisibleBoard, reversed = false): number {
	if (reversed) {
		return (1 + INVESTIGATION_MARKER_GOAL - turnStart.board.investigationMarker) / (1 + INVESTIGATION_MARKER_GOAL);
	} else {
		return (1 + turnStart.board.investigationMarker) / (1 + INVESTIGATION_MARKER_GOAL);
	}
}

export function remainingProgress(turnStart: HasVisibleBoard, reversed = false): number {
	if (reversed) {
		return (1 + turnStart.board.remainingEvidenceCount) / (1 + EVIDENCE_CARDS.length);
	} else {
		return (1 + EVIDENCE_CARDS.length - turnStart.board.remainingEvidenceCount) / (1 + EVIDENCE_CARDS.length);
	}
}

export function impossiblePastLimit(turnStart: HasVisibleBoard): number {
	return Math.max(0, turnStart.board.impossibleLimit - turnStart.board.impossibleCards.length);
}

export function holmesProgress(turnStart: HasVisibleBoard, reversed = false): number {
	if (reversed) {
		return (1 + turnStart.board.holmesLocation) / (1 + HOLMES_MAX);
	} else {
		return (1 + HOLMES_MAX - turnStart.board.holmesLocation) / (1 + HOLMES_MAX);
	}
}

export function rampUpWithProgress(base: number, progress: number): number {
	// Equivalent to -1 multiplier at 0%, 0 multiplier at 50%, and 1 multiplier at 100%;
	return 2.0 * (progress - 0.5) * base;
}

export function rampDownWithProgress(base: number, progress: number): number {
	// Equivalent to 1 multiplier at 0%, 0 multiplier at 50%, and -1 multiplier at 100%;
	return 2.0 * (0.5 - progress) * base;
}

export const EFFECT_WEIGHT_CALCULATORS: Record<EffectWeightModifier, BiFunction<number, HasVisibleBoard, number>> = {
	[EffectWeightModifier.MinusHolmesLocation]: (n, t) => n - t.board.holmesLocation,
	[EffectWeightModifier.MinusImpossibleCount]: (n, t) => n - t.board.impossibleCards.length,
	[EffectWeightModifier.MinusInvestigationMarker]: (n, t) => n - t.board.investigationMarker,
	[EffectWeightModifier.MinusImpossiblePastLimit]: (n, t) => n - impossiblePastLimit(t),
	[EffectWeightModifier.MinusRemainingCount]: (n, t) => n - t.board.remainingEvidenceCount,
	[EffectWeightModifier.OverHolmesLocation]: (n, t) => n / (1 + t.board.holmesLocation),
	[EffectWeightModifier.OverHolmesProgress]: (n, t) => n / holmesProgress(t),
	[EffectWeightModifier.OverHolmesProgressReversed]: (n, t) => n / holmesProgress(t, true),
	[EffectWeightModifier.OverImpossibleCount]: (n, t) => n / Math.max(1, t.board.impossibleCards.length),
	[EffectWeightModifier.OverImpossiblePastLimit]: (n, t) => n / Math.max(1, impossiblePastLimit(t)),
	[EffectWeightModifier.OverInvestigationProgress]: (n, t) => n / investigationProgress(t),
	[EffectWeightModifier.OverInvestigationProgressReversed]: (n, t) => n / investigationProgress(t, true),
	[EffectWeightModifier.OverRemainingCount]: (n, t) => n / (1 + t.board.remainingEvidenceCount),
	[EffectWeightModifier.OverRemainingProgress]: (n, t) => n / remainingProgress(t),
	[EffectWeightModifier.OverRemainingProgressReversed]: (n, t) => n / remainingProgress(t, true),
	[EffectWeightModifier.PlusHolmesLocation]: (n, t) => n + t.board.holmesLocation,
	[EffectWeightModifier.PlusImpossibleCount]: (n, t) => n + t.board.impossibleCards.length,
	[EffectWeightModifier.PlusImpossiblePastLimit]: (n, t) => n + impossiblePastLimit(t),
	[EffectWeightModifier.PlusInvestigationMarker]: (n, t) => n + t.board.investigationMarker,
	[EffectWeightModifier.PlusRemainingCount]: (n, t) => n + t.board.remainingEvidenceCount,
	[EffectWeightModifier.RampDownWithHolmesProgress]: (n, t) => rampDownWithProgress(n, holmesProgress(t)),
	[EffectWeightModifier.RampDownWithInvestigationProgress]: (n, t) => rampDownWithProgress(n, investigationProgress(t)),
	[EffectWeightModifier.RampUpWithHolmesProgress]: (n, t) => rampUpWithProgress(n, holmesProgress(t)),
	[EffectWeightModifier.RampUpWithInvestigationProgress]: (n, t) => rampUpWithProgress(n, investigationProgress(t)),
	[EffectWeightModifier.TimesHolmesProgress]: (n, t) => n * holmesProgress(t),
	[EffectWeightModifier.TimesHolmesProgressReversed]: (n, t) => n * holmesProgress(t, true),
	[EffectWeightModifier.TimesImpossiblePastLimit]: (n, t) => n * impossiblePastLimit(t),
	[EffectWeightModifier.TimesInvestigationProgress]: (n, t) => n * investigationProgress(t),
	[EffectWeightModifier.TimesInvestigationProgressReversed]: (n, t) => n * investigationProgress(t, true),
	[EffectWeightModifier.TimesRemainingProgress]: (n, t) => n * remainingProgress(t),
	[EffectWeightModifier.TimesRemainingProgressReversed]: (n, t) => n * remainingProgress(t, true),
};

export type EffectWeightFromTurn = (turn: HasVisibleBoard) => number;

export function compileEffectWeight(
	ops: EffectWeightFormula,
): EffectWeightFromTurn {
	if (ops.length < 1) {
		/* istanbul ignore next */
		throw new Error(`No ops for effectWeight`);
	}
	const [ base, modifier ] = ops;
	if (modifier == null) {
		return function noModifier(): number {
			return base;
		};
	}
	const calculator = EFFECT_WEIGHT_CALCULATORS[modifier];
	return function calculate(turn: HasVisibleBoard): number {
		return calculator(base, turn);
	};
}
