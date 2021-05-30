import { BotTurnEffectType, MUTABLE_EFFECT_TYPES } from "./BotTurn";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import { effectWeightFormula } from "./EffectWeight";
import { fillOutRun } from "./fillOutRun";
import { formatDecimal } from "./format/formatDecimal";
import { mergeRuns } from "./mergeRuns";
import { SimRun } from "./SimRun";
import { asIterable } from "./util/iteratorMap";
import { iteratorRing } from "./util/iteratorRing";
import { objectMap } from "./util/objectMap";
import { range } from "./util/range";
import { scalingIterator } from "./util/scalingIterator";
import { shuffleCopy } from "./util/shuffle";
import { strictDeepEqual } from "./util/strictDeepEqual";
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
		neighborSignature: `magnify(${formatDecimal(baseMag, 2)}, ${formatDecimal(offsetMag, 2)})`,
		weights,
	};
}

export function* neighborWithOneTranslation(
	simRun: SimRun,
	temperature: number,
	effectiveFormulas: EffectWeightOpsFromType,
): IterableIterator<SimRun> {
	const deltas = range(-temperature, temperature);
	for (const baseDelta of shuffleCopy(deltas)) {
		for (const offsetDelta of shuffleCopy(deltas)) {
			yield runTranslatedBy(simRun, baseDelta, offsetDelta, effectiveFormulas);
		}
	}
}

export function* neighborWithOneMagnification(
	simRun: SimRun,
	temperature: number,
	effectiveFormulas: EffectWeightOpsFromType,
): IterableIterator<SimRun> {
	for (const baseMag of shuffleCopy(MAGNIFICATIONS)) {
		for (const offsetMag of shuffleCopy(MAGNIFICATIONS)) {
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
		if (!strictDeepEqual(projected.weights, simRun.weights)) {
			yield projected;
		}
	}
}

export function neighborsViaFormulae(
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
		(temp: number) => (r: SimRun) => neighborWithOneProjection(r, temp, effectiveFormulas),
		(a: SimRun, b: SimRun) => mergeRuns(a, b, simRun, () => "", () => undefined),
		(r: SimRun) => scoreForWeights(r.weights) === undefined,
		(r: SimRun) => {
			const elapsed = timer();
			timer.reset();
			return fillOutRun(r, simRun, elapsed);
		},
		() => `neighborsViaFormulae giving up on ${simRun.id} at temp ${formatDecimal(temperature, 2)}.`
	);
}
