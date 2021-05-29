import { randomInt } from "../rng";
import { shuffleCopy } from "./shuffle";

export function iteratorSwirl<T, R, N>(...iterators: Iterator<T, R, N>[]): Iterator<T, R, N> {
	const shuffled = shuffleCopy(iterators);
	let keepGoing = true;
	return {
		next(arg: N): IteratorResult<T, R> {
			while (keepGoing && (shuffled.length > 0)) {
				const index = randomInt(shuffled.length - 1, 0);
				const iterator = iterators[index];
				const next = iterator.next(arg);
				if (next.value !== undefined) {
					return next;
				}
				iterators.splice(index, 1);
			}
			return { done: true, value: undefined as unknown as R };
		},
		return(value?: R): IteratorResult<T, R> {
			keepGoing = false;
			iterators.splice(0, iterators.length);
			return { done: true, value: value as unknown as R };
		},
		throw(e?: unknown): IteratorResult<T, R> {
			keepGoing = false;
			iterators.splice(0, iterators.length);
			throw e || new Error(`iteratorSwirl asked to throw`);
		},
	};
}
