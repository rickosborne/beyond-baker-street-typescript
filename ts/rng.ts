import * as seedrandom from "seedrandom";

export interface PseudoRNG {
	(): number;
}

type SeedRandom = (seed?: string, options?: seedrandom.Options, callback?: seedrandom.Callback) => PseudoRNG;
type SeedRandomModule = {
	default: SeedRandom;
}

export const DEFAULT_PRNG: PseudoRNG = Math.random;

const sr = "default" in seedrandom ? (seedrandom as unknown as SeedRandomModule).default : seedrandom;

export function buildRNG(
	seed?: string,
	options?: seedrandom.Options,
	callback?: seedrandom.Callback
): PseudoRNG {
	return sr(seed, options, callback);
}

export function randomInt(max = 100, min = 1): number {
	return Math.round(min + (Math.random() * (max - min + 1)));
}

export function randomPercent(): number {
	return randomInt(100) / 100;
}
