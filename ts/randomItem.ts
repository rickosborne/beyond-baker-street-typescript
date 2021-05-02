import { PseudoRNG } from "./rng";

export function randomItem<T>(items: T[], prng: PseudoRNG = Math.random): T {
	return items[Math.floor(prng() * items.length)];
}
