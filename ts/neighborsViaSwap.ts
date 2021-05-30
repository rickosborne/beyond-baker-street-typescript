import { BotTurnEffectType, MUTABLE_EFFECT_TYPES } from "./BotTurn";
import { Consumer } from "./Consumer";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import { effectWeightFormula, EffectWeightFormula, normalizeEffectWeightFormula } from "./EffectWeight";
import { fillOutRun } from "./fillOutRun";
import { formatDecimal } from "./format/formatDecimal";
import { mergeRuns } from "./mergeRuns";
import { SimRun } from "./SimRun";
import { scalingIterator } from "./util/scalingIterator";
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
	let [ fromBase, fromOffset, fromModifier ] = fromFormula;
	let [ toBase, toOffset, toModifier ] = toFormula;
	if (fromIndex === 2) {
		const originalFromModifier = fromModifier;
		fromModifier = toModifier;
		toModifier = originalFromModifier;
	} else {
		const fromSetter: Consumer<number> = fromIndex === 0 ? n => fromBase = n : n => fromOffset = n;
		const toSetter: Consumer<number> = toIndex === 0 ? n => toBase = n : n => toOffset = n;
		const originalFrom: number = (fromIndex === 0 ? fromBase : fromOffset) || 0;
		const originalTo: number = (toIndex === 0 ? toBase : toOffset) || 0;
		fromSetter(originalTo);
		toSetter(originalFrom);
	}
	const swapped: Partial<EffectWeightOpsFromType> = {
		[fromType]: normalizeEffectWeightFormula(effectWeightFormula(fromBase, fromOffset, fromModifier)),
		[toType]: normalizeEffectWeightFormula(effectWeightFormula(toBase, toOffset, toModifier)),
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

export function neighborsViaSwap(
	simRun: SimRun,
	temperature: number,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): IterableIterator<SimRun> {
	const timer = resettableTimer();
	const effectiveFormulas = toRecord(effectTypes, t => t, t => simRun.weights[t] || scoreFromType[t]);
	return scalingIterator<SimRun>(
		simRun,
		temperature,
		() => (r: SimRun) => neighborWithOneSwapIterator(r, effectiveFormulas, effectTypes),
		(a: SimRun, b: SimRun) => mergeRuns(a, b, simRun, () => "", () => undefined),
		(r: SimRun) => scoreForWeights(r.weights) === undefined,
		(r: SimRun) => {
			const elapsed = timer();
			timer.reset();
			return fillOutRun(r, simRun, elapsed);
		},
		() => `neighborsViaSwap giving up on ${simRun.id} at temp ${formatDecimal(temperature, 2)}.`,
	);
}
