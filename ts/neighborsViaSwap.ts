import { BotTurnEffectType } from "./BotTurn";
import { EffectWeightOpsFromType } from "./defaultScores";
import { EffectWeightFormula, EffectWeightModifier } from "./EffectWeight";
import { neighborsViaVariance } from "./neighborsViaVariance";
import { PseudoRNG } from "./rng";
import { idForWeights, SimRun } from "./SimRun";
import { objectMap } from "./util/objectMap";
import { shuffleInPlace } from "./util/shuffle";
import { strictDeepEqual } from "./util/strictDeepEqual";
import { msTimer } from "./util/timer";

export function neighborsViaSwap(
	effectTypes: BotTurnEffectType[],
	scoreFromType: EffectWeightOpsFromType,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
): (count: number, simRun: SimRun, temp: number, prng: PseudoRNG) => SimRun[] {
	const viaVariance = neighborsViaVariance(effectTypes, scoreFromType, scoreForWeights);
	let previousRun: SimRun;
	const allRuns: SimRun[] = [];
	const maxDistance = 6;
	const timer = msTimer();
	return function neighborsViaSwap(count: number, simRun: SimRun, temp: number, prng: PseudoRNG): SimRun[] {
		function addRunIfNovel(weights: EffectWeightOpsFromType,): void {
			if (!strictDeepEqual(weights, simRun.weights) && scoreForWeights(weights) === undefined) {
				allRuns.push({
					id: idForWeights(weights),
					msToFindNeighbor: undefined,
					neighborDepth: simRun.neighborDepth + 1,
					neighborOf: simRun,
					weights,
				});
			}
		}

		if (!strictDeepEqual(previousRun, simRun)) {
			previousRun = simRun;
			allRuns.splice(0, allRuns.length);
			const weights: EffectWeightOpsFromType = effectTypes.reduce((w, effectType) => {
				const ops = simRun.weights[effectType] || scoreFromType[effectType];
				const base = ops[0];
				w[effectType] = [base];
				return w;
			}, {} as EffectWeightOpsFromType);
			const orderedKeys = (Object.keys(weights) as BotTurnEffectType[]).slice()
				.sort((a, b) => (weights[a][0] as number) - (weights[b][0] as number));
			const keyCount = orderedKeys.length;
			const lastIndex = keyCount - 1;
			addRunIfNovel(objectMap(weights, (ops, type, index) => [Math.floor(lastIndex / 2) - index]));
			const smallest = orderedKeys
				.map(type => weights[type][0] as number)
				.filter(v => v > 0)
				.reduce((p, c) => Math.min(p, c), 1000);
			if (smallest > 1) {
				addRunIfNovel(objectMap(weights, ops => ops.length < 2 ? ops : ops.map((op: number | EffectWeightModifier, index: number) => index === 0 ? Math.round((op as number) / smallest) : op) as EffectWeightFormula));
				addRunIfNovel(objectMap(weights, ops => ops.length < 2 ? ops : ops.map((op: number | EffectWeightModifier, index: number) => index === 1 ? Math.round((op as number) / smallest) : op) as EffectWeightFormula));
				addRunIfNovel(objectMap(weights, ops => ops.length < 2 ? ops : ops.map((op: number | EffectWeightModifier, index: number) => index === 0 ? (op as number) - smallest : op) as EffectWeightFormula));
				addRunIfNovel(objectMap(weights, ops => ops.length < 2 ? ops : ops.map((op: number | EffectWeightModifier, index: number) => index === 1 ? (op as number) - smallest : op) as EffectWeightFormula));
			}
			const rotate = (sourceIndex: number, destIndex: number, weights: EffectWeightOpsFromType): void => {
				const direction = sourceIndex < destIndex ? 1 : -1;
				const first = weights[orderedKeys[sourceIndex]];
				for (let index = sourceIndex; index !== destIndex; index += direction) {
					weights[orderedKeys[index]] = weights[orderedKeys[index + direction]];
				}
				weights[orderedKeys[destIndex]] = first;
			};
			for (let distance = -maxDistance; distance <= maxDistance; distance++) {
				if (distance === 0) {
					continue;
				}
				for (let sourceIndex = 0; sourceIndex < keyCount; sourceIndex++) {
					const destIndex = sourceIndex + distance;
					if (destIndex < 0 || destIndex > lastIndex) {
						continue;
					}
					const farSwap = Object.assign({}, weights);
					const destKey = orderedKeys[destIndex];
					const sourceKey = orderedKeys[sourceIndex];
					[ farSwap[destKey], farSwap[sourceKey] ] = [ farSwap[sourceKey], farSwap[destKey] ];
					addRunIfNovel(farSwap);
					if (!strictDeepEqual(farSwap, simRun.weights) && scoreForWeights(farSwap) === undefined) {
						allRuns.push({
							id: idForWeights(farSwap),
							msToFindNeighbor: undefined,
							neighborDepth: simRun.neighborDepth + 1,
							neighborOf: simRun,
							weights: farSwap,
						});
					}
					if (distance > 1) {
						const left = Object.assign({}, weights);
						const right = Object.assign({}, weights);
						rotate(sourceIndex, destIndex, right);
						rotate(destIndex, sourceIndex, left);
						addRunIfNovel(left);
						addRunIfNovel(right);
					}
				}
			}
			// console.log(`Swapped neighbors: ${allRuns.length}`);
			shuffleInPlace(allRuns, prng);
		}
		if (allRuns.length === 0) {
			// console.log(`Falling back to variance`);
			allRuns.push(...viaVariance(1000, simRun, temp, prng));
		}
		const runs: SimRun[] = [];
		runs.push(...allRuns.splice(0, count));
		runs.forEach(r => r.msToFindNeighbor = timer());
		return runs;
	};
}
