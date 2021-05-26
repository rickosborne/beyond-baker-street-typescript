import { isIterable, isIterator } from "./iteratorMap";

export function collect<T>(source: Iterator<T, unknown, unknown> | Iterable<T>): T[] {
	const sourceIterator: Iterator<T, unknown, unknown> | undefined = isIterator(source) ? source : isIterable(source) ? source[Symbol.iterator]() as Iterator<T, unknown, unknown> : undefined;
	if (sourceIterator === undefined) {
		throw new Error(`Source should be an iterator or iterable.`);
	}
	const result: T[] = [];
	let done = false;
	while (!done) {
		const next = sourceIterator.next();
		if (next.value !== undefined) {
			result.push(next.value as T);
		} else {
			done = true;
		}
	}
	return result;
}
