import { countOf } from "./arrayMath";
import { BotTurnEffectType } from "./BotTurn";
import { enumKeys } from "./enumKeys";
import { EVIDENCE_CARDS } from "./EvidenceCard";
import { BiFunction } from "./Function";
import { HOLMES_MAX, INVESTIGATION_MARKER_GOAL } from "./Game";
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

export const EFFECT_WEIGHT_MODIFIERS = enumKeys<EffectWeightModifier>(EffectWeightModifier);

export type EffectWeightFormula = [number] | [ number, number, EffectWeightModifier ];

export function investigationProgress(turnStart: HasVisibleBoard, reversed = false, allowZero = false): number {
	const buffer = allowZero ? 0 : 1;
	if (reversed) {
		return (buffer + INVESTIGATION_MARKER_GOAL - turnStart.board.investigationMarker) / (buffer + INVESTIGATION_MARKER_GOAL);
	} else {
		return (buffer + turnStart.board.investigationMarker) / (buffer + INVESTIGATION_MARKER_GOAL);
	}
}

export function remainingProgress(turnStart: HasVisibleBoard, reversed = false, allowZero = false): number {
	const buffer = allowZero ? 0 : 1;
	if (reversed) {
		return (buffer + turnStart.board.remainingEvidenceCount) / (buffer + EVIDENCE_CARDS.length);
	} else {
		return (buffer + EVIDENCE_CARDS.length - turnStart.board.remainingEvidenceCount) / (buffer + EVIDENCE_CARDS.length);
	}
}

export function impossiblePastLimit(turnStart: HasVisibleBoard): number {
	return Math.max(0, turnStart.board.impossibleCards.length - turnStart.board.impossibleLimit);
}

export function holmesProgress(turnStart: HasVisibleBoard, reversed = false, allowZero = false): number {
	const buffer = allowZero ? 0 : 1;
	if (reversed) {
		return (buffer + turnStart.board.holmesLocation) / (buffer + HOLMES_MAX);
	} else {
		return (buffer + HOLMES_MAX - turnStart.board.holmesLocation) / (buffer + HOLMES_MAX);
	}
}

export function rampWithProgress(base: number, progress: number): number {
	// Equivalent to -1 multiplier at 0%, 0 multiplier at 50%, and 1 multiplier at 100%;
	return 2.0 * (progress - 0.5) * base;
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
	[EffectWeightModifier.OverImpossibleCount]: (n, t) => n / (1 + t.board.impossibleCards.length),
	[EffectWeightModifier.OverImpossiblePastLimit]: (n, t) => n / (1 + impossiblePastLimit(t)),
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
	[EffectWeightModifier.RampDownWithHolmesProgress]: (n, t) => rampWithProgress(n, holmesProgress(t, true, true)),
	[EffectWeightModifier.RampDownWithInvestigationProgress]: (n, t) => rampWithProgress(n, investigationProgress(t, true, true)),
	[EffectWeightModifier.RampUpWithHolmesProgress]: (n, t) => rampWithProgress(n, holmesProgress(t, false, true)),
	[EffectWeightModifier.RampUpWithInvestigationProgress]: (n, t) => rampWithProgress(n, investigationProgress(t, false, true)),
	[EffectWeightModifier.TimesHolmesProgress]: (n, t) => n * holmesProgress(t, false, true),
	[EffectWeightModifier.TimesHolmesProgressReversed]: (n, t) => n * holmesProgress(t, true, true),
	[EffectWeightModifier.TimesImpossiblePastLimit]: (n, t) => n * impossiblePastLimit(t),
	[EffectWeightModifier.TimesInvestigationProgress]: (n, t) => n * investigationProgress(t, false, true),
	[EffectWeightModifier.TimesInvestigationProgressReversed]: (n, t) => n * investigationProgress(t, true, true),
	[EffectWeightModifier.TimesRemainingProgress]: (n, t) => n * remainingProgress(t, false, true),
	[EffectWeightModifier.TimesRemainingProgressReversed]: (n, t) => n * remainingProgress(t, true, true),
};

export type EffectWeightFromTurn = (turn: HasVisibleBoard, effects: BotTurnEffectType[]) => number;

export function compileEffectWeight(
	ops: EffectWeightFormula,
	effectType: BotTurnEffectType,
): EffectWeightFromTurn {
	if (ops.length < 1) {
		throw new Error(`No ops for effectWeight`);
	}
	const [ base, offset, modifier ] = ops;
	const getBase: (effects: BotTurnEffectType[]) => number = effectType.startsWith("Investigate")
		? e => base / countOf(BotTurnEffectType.InvestigatePossibility, e)
		: effectType.startsWith("Eliminate")
		? e => base / countOf(BotTurnEffectType.EliminatePossibility, e)
		: () => base;
	const getModified: (turn: HasVisibleBoard) => number = modifier === undefined || offset === undefined ? () => 0 : turn => EFFECT_WEIGHT_CALCULATORS[modifier](offset, turn);
	return (turn, effects) => getBase(effects) + getModified(turn);
}

export function formatEffectWeightModifier(modifier: EffectWeightModifier | undefined): string {
	if (modifier === undefined) {
		return "";
	}
	return String(modifier)
		.replace("Plus", "+")
		.replace("Minus", "-")
		.replace("Times", "*")
		.replace("Over", "/")
		.replace("RampUpWith", "⬆")
		.replace("RampDownWith", "⬇")
		.replace("Count", "#")
		.replace("Progress", "%")
		.replace("Marker", "@")
		.replace("Location", "@")
		.replace("Reversed", "↩")
	;
}

export function formatEffectWeightFormula(formula: EffectWeightFormula | undefined): string {
	if (formula === undefined) {
		return "";
	}
	const [ base, offset, modifier ] = formula;
	if (offset !== undefined && modifier !== undefined) {
		return `${base}${offset < 0 ? offset : offset === 0 ? "" : `+${offset}`}${formatEffectWeightModifier(modifier)}`;
	}
	return String(base);
}

export function normalizeEffectWeightFormula(formula: EffectWeightFormula): EffectWeightFormula {
	const [ base, offset, modifier ] = formula;
	if (offset === undefined || modifier === undefined) {
		return formula;
	}
	if (modifier.startsWith("Plus") || modifier.startsWith("Minus")) {
		return [ base + offset, 0, modifier ];
	} else if (offset === 0) {
		return [base];
	}
	return formula;
}
