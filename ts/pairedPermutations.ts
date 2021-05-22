import { BiFunction, MonoFunction, Supplier } from "./Function";
import { range } from "./range";
import { shuffleInPlace } from "./shuffle";

export function pairedPermutations<T>(items: T[]): [ T, T ][] {
	const result: [ T, T ][] = [];
	for (let i = 0; i < items.length - 1; i++) {
		const left = items[i];
		const pairs = items.slice(i + 1).map(right => [ left, right ] as [ T, T ]);
		result.push(...pairs);
	}
	return result;
}

export function pairedPermutations2<A, B>(aItems: A[], bItems: B[]): [ A, B ][] {
	const result: [ A, B ][] = [];
	for (let i = 0; i < aItems.length - 1; i++) {
		const left = aItems[i];
		const pairs = bItems.slice(i + 1).map(right => [ left, right ] as [ A, B ]);
		result.push(...pairs);
	}
	return result;
}

export function *shufflingIterator<T>(items: T[]): IterableIterator<T> {
	for (const item of shuffleInPlace(items.slice())) {
		yield item;
	}
}

export function *shufflingPairIterator<A, B>(aItems: A[], bItems: B[]): IterableIterator<[A, B]> {
	if (aItems.length === 0 || bItems.length === 0) {
		return;
	}
	for (const [ a, b ] of shuffleInPlace(pairedPermutations2(range(0, aItems.length - 1), range(0, bItems.length - 1)))) {
		yield [ aItems[a], bItems[b] ];
	}
}

export function *combineAndIterate<T>(
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
