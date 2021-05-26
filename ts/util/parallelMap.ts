import { Consumer } from "../Consumer";
import { BiFunction } from "../Function";
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
	iterator: Iterator<T, undefined>,
	threadCount: number,
	block: BiFunction<T, ParallelContext, U | PromiseLike<U>>,
	// istanbul ignore next
	consumer: Consumer<U> = () => void(0),
): Promise<void> {
	const resolver = (results: U[], threadId: number, itemNumber: number): Consumer<Consumer<U[] | PromiseLike<U[]>>> => {
		return resolve => {
			const { done, value } = iterator.next();
			if (value !== undefined) {
				const maybeU = block(value, { itemNumber, threadId });
				if (isPromiseLike(maybeU)) {
					maybeU.then(u => {
						results.push(u);
						consumer(u);
						resolve(new Promise<U[]>(resolver(results, threadId, itemNumber + 1)));
					});
				} else {
					results.push(maybeU);
					consumer(maybeU);
					resolve(new Promise<U[]>(resolver(results, threadId, itemNumber + 1)));
				}
			} else if (done) {
				resolve(results);
			} else {
				// istanbul ignore next
				throw new Error(`Iterator returned neither value nor done: done=${JSON.stringify(done)}, value=${JSON.stringify(value)}`);
			}
		};
	};
	const slots = range(1, Math.max(1, threadCount));
	const threads = slots.map(threadId => new Promise<U[]>(resolver([], threadId, 0)));
	await Promise.all(threads);
}
