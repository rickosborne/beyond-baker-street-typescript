import { arrayIterator } from "./arrayIterator";
import { Consumer } from "./Consumer";
import { BiFunction } from "./Function";
import { range } from "./range";

export interface ParallelContext {
	itemNumber: number;
	threadId: number;
}

export function isPromiseLike<T>(maybe: unknown): maybe is PromiseLike<T> {
	return (maybe != null)
		&& (typeof (maybe as PromiseLike<T>).then === "function");
}

export async function parallelMap<T, U>(
	items: T[],
	threadCount: number,
	block: BiFunction<T, ParallelContext, U | PromiseLike<U>>,
): Promise<U[]> {
	const iterator = arrayIterator(items);
	const resolver = (results: U[], threadId: number, itemNumber: number): Consumer<Consumer<U[] | PromiseLike<U[]>>> => {
		return resolve => {
			const { done, value } = iterator.next();
			if (value !== undefined) {
				const maybeU = block(value, { itemNumber, threadId });
				if (isPromiseLike(maybeU)) {
					maybeU.then(u => {
						results.push(u);
						resolve(new Promise<U[]>(resolver(results, threadId, itemNumber + 1)));
					});
				} else {
					results.push(maybeU);
					resolve(new Promise<U[]>(resolver(results, threadId, itemNumber + 1)));
				}
			} else if (done) {
				resolve(results);
			} else {
				throw new Error(`Iterator returned neither value nor done: done=${JSON.stringify(done)}, value=${JSON.stringify(value)}`);
			}
		};
	};
	const slots = range(1, Math.max(1, threadCount));
	const threads = slots.map(threadId => new Promise<U[]>(resolver([], threadId, 0)));
	const threadResults = await Promise.all(threads);
	return threadResults.flatMap(n => n);
}
