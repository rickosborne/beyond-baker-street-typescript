import { EffectWeightOpsFromType } from "./defaultScores";
import { MonoFunction, Supplier } from "./Function";
import { idForWeights, SimRun } from "./SimRun";

export function mergeRuns(
	a: SimRun,
	b: SimRun,
	neighborOf: SimRun | undefined,
	idGenerator: MonoFunction<Partial<EffectWeightOpsFromType>, string> = idForWeights,
	msToFindNeighborGenerator: Supplier<number | undefined> = () => undefined,
): SimRun {
	const weights = Object.assign({}, a.weights, b.weights);
	let neighborSignature: string;
	if (a.neighborSignature === undefined) {
		neighborSignature = b.neighborSignature;
	} else if (b.neighborSignature === undefined || a.neighborSignature === b.neighborSignature) {
		neighborSignature = a.neighborSignature;
	} else {
		neighborSignature = `${a.neighborSignature}+${b.neighborSignature}`;
	}
	return {
		id: idGenerator(weights),
		msToFindNeighbor: msToFindNeighborGenerator(),
		neighborDepth: Math.min(a.neighborDepth, b.neighborDepth),
		neighborOf,
		neighborSignature,
		weights,
	};
}
