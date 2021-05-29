import { BotTurnEffectType, MUTABLE_EFFECT_TYPES } from "./BotTurn";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import { effectWeightFormula } from "./EffectWeight";
import { fillOutRun } from "./fillOutRun";
import { BiFunction } from "./Function";
import { mergeRuns } from "./mergeRuns";
import { SimRun } from "./SimRun";
import { combineAndIterate } from "./util/combineAndIterate";
import { asIterable } from "./util/iteratorMap";
import { iteratorRing } from "./util/iteratorRing";
import { objectMap } from "./util/objectMap";
import { range } from "./util/range";
import { resettableTimer } from "./util/timer";
import { toRecord } from "./util/toRecord";

export function runTranslatedBy(
	neighborOf: SimRun,
	baseDelta: number,
	offsetDelta: number,
	effectiveFormulas: EffectWeightOpsFromType,
): SimRun {
	const weights = objectMap(effectiveFormulas, f => effectWeightFormula(f[0] + baseDelta, (f[1] || 0) + offsetDelta, f[2])) as EffectWeightOpsFromType;
	return {
		id: "",
		msToFindNeighbor: undefined,
		neighborDepth: neighborOf.neighborDepth + 1,
		neighborOf,
		neighborSignature: `translate(${baseDelta}, ${offsetDelta})`,
		weights,
	};
}

const MAGNIFICATIONS: number[] = [ 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 3.0, 4.0, 5.0 ];

export function runMagnifiedBy(
	neighborOf: SimRun,
	baseMag: number,
	offsetMag: number,
	effectiveFormulas: EffectWeightOpsFromType,
): SimRun {
	const weights = objectMap(effectiveFormulas, f => effectWeightFormula(Math.round(f[0] * baseMag), Math.round((f[1] || 0) * offsetMag), f[2])) as EffectWeightOpsFromType;
	return {
		id: "",
		msToFindNeighbor: undefined,
		neighborDepth: neighborOf.neighborDepth + 1,
		neighborOf,
		neighborSignature: `magnify(${baseMag}, ${offsetMag})`,
		weights,
	};
}

export function* neighborWithOneTranslation(
	simRun: SimRun,
	temperature: number,
	effectiveFormulas: EffectWeightOpsFromType,
): IterableIterator<SimRun> {
	for (let baseDelta = -temperature; baseDelta <= temperature; baseDelta++) {
		for (let offsetDelta = -temperature; offsetDelta <= temperature; offsetDelta++) {
			yield runTranslatedBy(simRun, baseDelta, offsetDelta, effectiveFormulas);
		}
	}
}

export function* neighborWithOneMagnification(
	simRun: SimRun,
	temperature: number,
	effectiveFormulas: EffectWeightOpsFromType,
): IterableIterator<SimRun> {
	for (const baseMag of MAGNIFICATIONS) {
		for (const offsetMag of MAGNIFICATIONS) {
			yield runMagnifiedBy(simRun, temperature * baseMag, temperature * offsetMag, effectiveFormulas);
		}
	}
}

export function* neighborWithOneProjection(
	simRun: SimRun,
	temperature: number,
	effectiveFormulas: EffectWeightOpsFromType,
): IterableIterator<SimRun> {
	const iterator = iteratorRing<SimRun, undefined, undefined>(
		neighborWithOneTranslation(simRun, temperature, effectiveFormulas),
		neighborWithOneMagnification(simRun, temperature, effectiveFormulas),
	);
	for (const projected of asIterable(iterator)) {
		yield projected;
	}
}

export function* neighborsViaFormulae(
	simRun: SimRun,
	temperature: number,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): IterableIterator<SimRun> {
	const timer = resettableTimer();
	const effectiveFormulas = toRecord(effectTypes, t => t, t => simRun.weights[t] || scoreFromType[t]);
	for (let temp = 1; temp < temperature; temp++) {
		const iterators = range(1, temp).map(() => (r: SimRun) => neighborWithOneProjection(r, temp, effectiveFormulas));
		const runMerger: BiFunction<SimRun, SimRun, SimRun> = (a, b) => mergeRuns(a, b, simRun, () => "", () => undefined);
		for (const neighbor of combineAndIterate(simRun, runMerger, iterators)) {
			if (scoreForWeights(neighbor.weights) === undefined) {
				yield fillOutRun(neighbor, simRun, timer);
				timer.reset();
			}
		}
	}
}
