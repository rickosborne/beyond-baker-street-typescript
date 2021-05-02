import * as seedrandom from "seedrandom";

export interface PseudoRNG {
	(): number;
}

type SeedRandom = (seed?: string, options?: seedrandom.Options, callback?: seedrandom.Callback) => PseudoRNG;
type SeedRandomModule = {
	default: SeedRandom;
}

const sr = "default" in seedrandom ? (seedrandom as unknown as SeedRandomModule).default : seedrandom;

export function buildRNG(
	seed?: string,
	options?: seedrandom.Options,
	callback?: seedrandom.Callback
): PseudoRNG {
	return sr(seed, options, callback);
}
