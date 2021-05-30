import { isIterable } from "./iteratorMap";

export function iteratorRing<T, R, N>(...iterators: (Iterator<T, R, N> | IterableIterator<T>)[]): Iterator<T, R, N> & Iterable<T> {
	let index = 0;
	let keepGoing = true;
	const its: Iterator<T, R, N>[] = iterators.map(i => isIterable(i) ? i[Symbol.iterator]() as Iterator<T, R, N> : i);
	const resultIterator: Iterator<T, R, N> = {
		next(arg: N): IteratorResult<T, R> {
			let attempts = 0;
			while (keepGoing && its.length > 0) {
				attempts++;
				if (attempts > 50) {
					throw new Error(`iteratorRing went too long: ${its.length} ${index} ${keepGoing}`);
				}
				index = (index + 1) % its.length;
				const iterator = its[index];
				const next = iterator.next(arg);
				if (next.value !== undefined) {
					return next;
				}
				its.splice(index, 1);
			}
			keepGoing = false;
			return { done: true, value: undefined as unknown as R };
		},
		return(value?: R): IteratorResult<T, R> {
			keepGoing = false;
			return { done: true, value: value as R };
		},
		throw(e?: unknown): IteratorResult<T, R> {
			keepGoing = false;
			throw e || new Error(`iteratorRing asked to throw`);
		},
	};
	const iterable: Iterable<T> = {
		[Symbol.iterator](): Iterator<T> {
			return resultIterator as Iterator<T>;
		},
	};
	return Object.assign(iterable, resultIterator);
}
