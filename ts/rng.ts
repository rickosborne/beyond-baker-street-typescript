import * as seedrandom from "seedrandom";

export interface PseudoRNG {
	(): number;
	double(): number;
	int32(): number;
	quick(): number;
	state(): seedrandom.State;
}

type SeedRandom = (seed?: string, options?: seedrandom.Options, callback?: seedrandom.Callback) => PseudoRNG;
type SeedRandomModule = {
	default: SeedRandom;
}

export function buildRNG(
	seed?: string,
	options?: seedrandom.Options,
	callback?: seedrandom.Callback
): PseudoRNG {
	return (seedrandom as unknown as SeedRandomModule).default(seed, options, callback);
}
