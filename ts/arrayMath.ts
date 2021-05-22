import { BiPredicate, Predicate } from "./Predicate";

export function sum(items: number[]): number {
	return items.reduce((p, c) => p + c, 0);
}

export function mean(items: number[], defaultValue = 0): number {
	return items.length > 0 ? sum(items) / items.length : defaultValue;
}

export function stddev(items: number[], avg = mean(items)): number {
	if (items.length === 0) {
		return 0;
	}
	return Math.sqrt(mean(items.map(n => Math.pow(n - avg, 2))));
}

export function countOf<T>(expected: T, items: T[], equals: BiPredicate<T> = (a, b) => a === b): number {
	let count = 0;
	for (const actual of items) {
		if (equals(actual, expected)) {
			count++;
		}
	}
	return count;
}
