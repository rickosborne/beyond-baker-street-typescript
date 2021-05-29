import { MonoFunction } from "../Function";

export function isIterator<T, R, N>(maybe: unknown): maybe is Iterator<T, R, N> {
	return maybe != null && (typeof (maybe as Iterator<T, R, N>).next === "function");
}

export function isIterable<T>(maybe: unknown): maybe is Iterable<T> {
	return maybe != null && (typeof (maybe as Iterable<T>)[Symbol.iterator] === "function");
}

export function asIterable<T>(iterator: Iterator<T, unknown, unknown>): Iterable<T> {
	return Object.assign({
		[Symbol.iterator](): Iterator<T> {
			return iterator;
		},
	}, iterator);
}

export function iteratorMap<T, U, R, N>(source: Iterator<T, R, N> | Iterable<T>, mapper: MonoFunction<T, U>): Iterator<U, R, N> {
	let done = false;
	const sourceIterator: Iterator<T, R, N> | undefined = isIterator(source) ? source : isIterable(source) ? source[Symbol.iterator]() as Iterator<T, R, N> : undefined;
	if (sourceIterator === undefined) {
		throw new Error(`Source should be an iterator or iterable.`);
	}
	return {
		next(n: N): IteratorResult<U, R> {
			if (done) {
				return { done: true, value: undefined as unknown as R };
			}
			const upstream = sourceIterator.next(n);
			if (done || upstream.done) {
				done = true;
				return { done: true, value: upstream.value as R };
			}
			return {
				value: mapper(upstream.value),
			};
		},
		return(value?: R): IteratorResult<U, R> {
			done = true;
			const r = sourceIterator.return !== undefined ? sourceIterator.return(value).value as R : value;
			return {
				done: true,
				value: r as R,
			};
		},
		throw(e?: unknown): IteratorResult<U, R> {
			done = true;
			const r = sourceIterator.throw !== undefined ? sourceIterator.throw(e).value as R : undefined;
			return {
				done: true,
				value: r as R,
			};
		},
	};
}
