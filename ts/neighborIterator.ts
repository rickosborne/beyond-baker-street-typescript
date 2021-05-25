import { BotTurnEffectType, MUTABLE_EFFECT_TYPES } from "./BotTurn";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import {
	EFFECT_WEIGHT_MODIFIERS,
	EffectWeightFormula,
	EffectWeightModifier,
	normalizeEffectWeightFormula,
} from "./EffectWeight";
import { TriFunction } from "./Function";
import { combineAndIterate, shufflingPairIterator } from "./pairedPermutations";
import { range } from "./range";
import { SimRun } from "./SimRun";
import { strictDeepEqual } from "./strictDeepEqual";

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

function *formulaChangeIterator(
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

function *neighborWithOneChangeIterator(
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
			const w = Object.create(weights);
			if (offset !== undefined && mod !== undefined) {
				w[effectType] = [ base, offset, mod ];
			} else {
				w[effectType] = [base];
			}
			return w;
		};
		const prevFormula: EffectWeightFormula = simRun.weights[effectType] || scoreFromType[effectType];
		for (const formula of formulaChangeIterator(prevFormula, temperature, modifier)) {
			const updatedWeights = withFormula(formula);
			yield { weights: updatedWeights };
		}
	}
}

function mergeRuns(a: SimRun, b: SimRun): SimRun {
	return {
		weights: Object.assign({}, a.weights, b.weights),
	};
}

function *neighborIteratorForTemperature(
	simRun: SimRun,
	temperature: number,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	modifiers: EffectWeightModifier[] = EFFECT_WEIGHT_MODIFIERS,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): IterableIterator<SimRun> {
	let changeCount = 1;
	while (changeCount < 10) {
		const iterators = range(1, changeCount).map(() => (r: SimRun) => neighborWithOneChangeIterator(r, temperature, scoreForWeights, effectTypes, modifiers, scoreFromType));
		for (const neighbor of combineAndIterate(simRun, mergeRuns, iterators)) {
			// console.log(`Neighbor cc${changeCount} t${temperature}: ${formatOrderedEffectWeightOpsFromType(simRun.weights)} --> ${formatOrderedEffectWeightOpsFromType(neighbor.weights)}`);
			if (scoreForWeights(neighbor.weights) === undefined) {
				yield neighbor;
			}
		}
		changeCount++;
		// console.log(`Change count ${changeCount} for temp ${temperature} weights: ${formatOrderedEffectWeightOpsFromType(simRun.weights)}`);
	}
}

export function neighborIterator(
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	modifiers: EffectWeightModifier[] = EFFECT_WEIGHT_MODIFIERS,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): (simRun: SimRun) => Iterator<SimRun, undefined, number> {
	return function (simRun: SimRun): Iterator<SimRun, undefined, number> {
		const generators: Record<number, Iterator<SimRun, undefined>> = {};
		return {
			next: (temperature: number): IteratorResult<SimRun, undefined> => {
				let temp = Math.round(temperature);
				while (temp > 0) {
					let generator = generators[temp];
					if (generator === undefined) {
						generator = neighborIteratorForTemperature(simRun, temp, scoreForWeights, effectTypes, modifiers, scoreFromType);
					}
					const next = generator.next();
					if (next.value !== undefined) {
						return next;
					}
					temp--;
					// console.log(`Temp at ${temp} for ${formatOrderedEffectWeightOpsFromType(simRun.weights)}`);
				}
				return { done: true, value: undefined };
			},
		};
	};
}
