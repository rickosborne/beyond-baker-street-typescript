import { BotTurnEffectType, MUTABLE_EFFECT_TYPES } from "./BotTurn";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import { EffectWeightFormula, EffectWeightModifier, normalizeEffectWeightFormula } from "./EffectWeight";
import { fillOutRun } from "./fillOutRun";
import { BiFunction } from "./Function";
import { mergeRuns } from "./mergeRuns";
import { SimRun } from "./SimRun";
import { combineAndIterate } from "./util/combineAndIterate";
import { range } from "./util/range";
import { shuffleCopy } from "./util/shuffle";
import { resettableTimer } from "./util/timer";
import { toRecord } from "./util/toRecord";

function runWithSwappedFormulaIndex(
	run: SimRun,
	fromIndex: number,
	toIndex: number,
	fromType: BotTurnEffectType,
	toType: BotTurnEffectType,
	fromFormula: EffectWeightFormula,
	toFormula: EffectWeightFormula,
): SimRun {
	const updatedFrom = fromFormula.slice() as EffectWeightFormula;
	const updatedTo = toFormula.slice() as EffectWeightFormula;
	const defaultValue: EffectWeightModifier | number = fromIndex === 2 ? undefined as unknown as EffectWeightModifier : 0;
	[ updatedFrom[fromIndex], updatedTo[toIndex] ] = [ updatedTo[toIndex] || defaultValue, updatedFrom[fromIndex] || defaultValue ];
	const swapped: Partial<EffectWeightOpsFromType> = {
		[fromType]: normalizeEffectWeightFormula(updatedFrom),
		[toType]: normalizeEffectWeightFormula(updatedTo),
	};
	const weights = Object.assign({}, run.weights, swapped);
	return {
		id: "",
		msToFindNeighbor: undefined,
		neighborDepth: run.neighborDepth + 1,
		neighborOf: run,
		neighborSignature: `swap(${fromType}[${fromIndex}], ${toType}[${toIndex}])`,
		weights,
	};
}

const FORMULA_SWAP_INDEX_PAIRS: [number, number][] = [
	[ 0, 0 ], // bases
	[ 1, 1 ], // offsets
	[ 2, 2 ], // modifiers
	[ 0, 1 ], // base <=> offset
	[ 1, 0 ], // offset <=> base
];

export function* neighborWithOneSwapIterator(
	simRun: SimRun,
	effectiveFormulas: Record<BotTurnEffectType, EffectWeightFormula>,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => (number | undefined),
	effectTypes: BotTurnEffectType[],
): IterableIterator<SimRun> {
	for (const fromType of shuffleCopy(effectTypes)) {
		for (const toType of shuffleCopy(effectTypes)) {
			if (toType === fromType) {
				continue;
			}
			const fromFormula = effectiveFormulas[fromType];
			const toFormula = effectiveFormulas[toType];
			for (const [ fromIndex, toIndex ] of FORMULA_SWAP_INDEX_PAIRS) {
				yield runWithSwappedFormulaIndex(simRun, fromIndex, toIndex, fromType, toType, fromFormula, toFormula);
			}
		}
	}
}

export function* neighborsViaSwap(
	simRun: SimRun,
	temperature: number,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): IterableIterator<SimRun> {
	const timer = resettableTimer();
	const effectiveFormulas = toRecord(effectTypes, t => t, t => simRun.weights[t] || scoreFromType[t]);
	for (let temp = 1; temp < temperature; temp++) {
		const iterators = range(1, temp).map(() => (r: SimRun) => neighborWithOneSwapIterator(r, effectiveFormulas, scoreForWeights, effectTypes));
		const runMerger: BiFunction<SimRun, SimRun, SimRun> = (a, b) => mergeRuns(a, b, simRun, () => "", () => undefined);
		for (const neighbor of combineAndIterate(simRun, runMerger, iterators)) {
			if (scoreForWeights(neighbor.weights) === undefined) {
				yield fillOutRun(neighbor, simRun, timer);
				timer.reset();
			}
		}
	}
}
