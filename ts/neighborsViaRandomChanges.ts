import { BotTurnEffectType, MUTABLE_EFFECT_TYPES } from "./BotTurn";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import {
	EFFECT_WEIGHT_MODIFIERS, effectWeightFormula,
	EffectWeightFormula,
	EffectWeightModifier,
	normalizeEffectWeightFormula,
} from "./EffectWeight";
import { fillOutRun } from "./fillOutRun";
import { formatDecimal } from "./format/formatDecimal";
import { TriFunction } from "./Function";
import { mergeRuns } from "./mergeRuns";
import { SimRun } from "./SimRun";
import { scalingIterator } from "./util/scalingIterator";
import { shufflingPairIterator } from "./util/shufflingPairIterator";
import { strictDeepEqual } from "./util/strictDeepEqual";
import { resettableTimer } from "./util/timer";

const FORMULA_CHANGES: TriFunction<EffectWeightFormula, number, EffectWeightModifier, EffectWeightFormula>[] = [
	(f, t) => [ f[0] + t, f[1], f[2] ] as EffectWeightFormula,
	(f, t) => [ f[0] - t, f[1], f[2] ] as EffectWeightFormula,
	(f, t, m) => [ f[0], (f[1] || 0) + t, f[2] || m ],
	(f, t, m) => [ f[0], (f[1] || 0) - t, f[2] || m ],
	(f, t, m) => [ f[0] + t, (f[1] || 0) + t, f[2] || m ],
	(f, t, m) => [ f[0] + t, (f[1] || 0) - t, f[2] || m ],
	(f, t, m) => [ f[0] - t, (f[1] || 0) + t, f[2] || m ],
	(f, t, m) => [ f[0] - t, (f[1] || 0) - t, f[2] || m ],
	(f, t, m) => [ f[0] + t, f[1] || 0, m ],
	(f, t, m) => [ f[0] - t, f[1] || 0, m ],
	(f, t, m) => [ f[0], (f[1] || 0) + t, m ],
	(f, t, m) => [ f[0], (f[1] || 0) - t, m ],
	(f, t, m) => [ f[0] + t, (f[1] || 0) + t, m ],
	(f, t, m) => [ f[0] + t, (f[1] || 0) - t, m ],
	(f, t, m) => [ f[0] - t, (f[1] || 0) + t, m ],
	(f, t, m) => [ f[0] - t, (f[1] || 0) - t, m ],
];

function* formulaChangeIterator(
	formula: EffectWeightFormula,
	temperature: number,
	modifier: EffectWeightModifier,
): IterableIterator<EffectWeightFormula> {
	const seen: EffectWeightFormula[] = [];
	for (let t = temperature; t >= 0; t -= 2) {
		for (const change of FORMULA_CHANGES) {
			const updated = normalizeEffectWeightFormula(change(formula, t, modifier));
			if (seen.findIndex(p => strictDeepEqual(p, updated)) < 0) {
				seen.push(updated);
				yield updated;
			}
		}
	}
}

function* neighborWithOneChangeIterator(
	simRun: SimRun,
	temperature: number,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	modifiers: EffectWeightModifier[] = EFFECT_WEIGHT_MODIFIERS,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): IterableIterator<SimRun> {
	for (const [ effectType, modifier ] of shufflingPairIterator(effectTypes, modifiers)) {
		const weights: Partial<EffectWeightOpsFromType> = Object.assign({}, simRun.weights);
		const withFormula: (formula: EffectWeightFormula) => Partial<EffectWeightOpsFromType> = ([ base, offset, mod ]) => {
			return Object.assign({}, weights, { [effectType]: effectWeightFormula(base, offset, mod) });
		};
		const prevFormula: EffectWeightFormula = simRun.weights[effectType] || scoreFromType[effectType];
		for (const formula of formulaChangeIterator(prevFormula, temperature, modifier)) {
			const updatedWeights = withFormula(formula);
			yield {
				id: "",
				msToFindNeighbor: undefined,
				neighborDepth: simRun.neighborDepth + 1,
				neighborOf: undefined,
				neighborSignature: `change(${effectType}, ${temperature}, ${modifier})`,
				weights: updatedWeights,
			};
		}
	}
}

export function neighborsViaRandomChanges(
	simRun: SimRun,
	temperature: number,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	modifiers: EffectWeightModifier[] = EFFECT_WEIGHT_MODIFIERS,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): IterableIterator<SimRun> {
	const timer = resettableTimer();
	return scalingIterator<SimRun>(
		simRun,
		temperature,
		t => (r: SimRun) => neighborWithOneChangeIterator(r, t, scoreForWeights, effectTypes, modifiers, scoreFromType),
		(a: SimRun, b: SimRun) => mergeRuns(a, b, simRun, () => "", () => undefined),
		(r: SimRun) => scoreForWeights(r.weights) === undefined,
		(r: SimRun) => {
			const elapsed = timer();
			timer.reset();
			return fillOutRun(r, simRun, elapsed);
		},
		() => `neighborsViaRandomChanges giving up on ${simRun.id} at temp ${formatDecimal(temperature, 2)}.`,
	);
}
