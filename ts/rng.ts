import * as seedrandom from "seedrandom";

export interface PseudoRNG {
	(): number;
	double(): number;
	int32(): number;
	quick(): number;
	state(): seedrandom.State;
}

export function buildRNG(
	seed?: string,
	options?: seedrandom.Options,
	callback?: seedrandom.Callback
): PseudoRNG {
	return seedrandom(seed, options, callback);
}
