import { BiPredicate } from "../Predicate";

export function countOf<T>(expected: T, items: T[], equals: BiPredicate<T> = (a, b) => a === b): number {
	let count = 0;
	for (const actual of items) {
		if (equals(actual, expected)) {
			count++;
		}
	}
	return count;
}
