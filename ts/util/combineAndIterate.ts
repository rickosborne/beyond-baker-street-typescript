import { BiFunction, MonoFunction } from "../Function";

export function* combineAndIterate<T>(
	starter: T,
	combiner: BiFunction<T, T, T>,
	iterators: MonoFunction<T, IterableIterator<T>>[],
): IterableIterator<T> {
	if (iterators.length === 0) {
		return;
	} else if (iterators.length === 1) {
		const iterator = iterators[0];
		for (const t of iterator(starter)) {
			yield t;
		}
	} else {
		const iterator = iterators[0];
		const rest = iterators.slice(1);
		for (const t of iterator(starter)) {
			for (const u of combineAndIterate(t, combiner, rest)) {
				yield combiner(t, u);
			}
		}
	}
}
