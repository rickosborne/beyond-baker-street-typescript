import { PseudoRNG } from "./rng";

export function randomItem<T>(items: T[], prng: PseudoRNG): T {
	return items[Math.floor(prng() * items.length)];
}
