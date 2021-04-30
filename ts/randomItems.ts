import { PseudoRNG } from "./rng";

export function randomItems<T>(items: T[], count: number, prng: PseudoRNG): T[] {
	const copy = items.slice();
	const result: T[] = [];
	while (copy.length > 0 && result.length < count) {
		const index = Math.floor(prng() * copy.length);
		result.push(copy[index]);
		copy.splice(index, 1);
	}
	return result;
}
