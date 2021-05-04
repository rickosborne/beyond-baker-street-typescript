import { DEFAULT_PRNG, PseudoRNG } from "./rng";

export function shuffleInPlace<T>(items: T[], prng: PseudoRNG = DEFAULT_PRNG): T[] {
	const itemCount = items.length;
	for (let i = 0; i < itemCount; i++) {
		const j = Math.floor(prng() * itemCount);
		const c = items[i];
		items[i] = items[j];
		items[j] = c;
	}
	return items;
}
