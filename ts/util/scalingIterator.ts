import { BiFunction, MonoFunction, Supplier } from "../Function";
import { Predicate } from "../Predicate";
import { combineAndIterate } from "./combineAndIterate";
import { range } from "./range";

export function *scalingIterator<T>(
	initialValue: T,
	upperBound: number,
	iteratorGenerator: MonoFunction<number, MonoFunction<T, IterableIterator<T>>>,
	combiner: BiFunction<T, T, T>,
	predicate: Predicate<T>,
	finalize: MonoFunction<T, T>,
	abandonMessageBuilder: Supplier<string>,
	maxMisses = 100000,
): IterableIterator<T> {
	for (let temp = 1; temp < upperBound; temp++) {
		const iterators = range(1, temp).map(iteratorGenerator);
		let misses = 0;
		for (const neighbor of combineAndIterate(initialValue, combiner, iterators)) {
			if (predicate(neighbor)) {
				yield finalize(neighbor);
			} else {
				misses++;
				if (misses > maxMisses) {
					console.warn(`\n${abandonMessageBuilder()}`);
					return;
				}
			}
		}
	}
}
