/**
 * Worst knapsack implementation ever.
 */
import { EvidenceValue } from "./EvidenceValue";
import { range } from "./range";

export const summingPathsTo: (target: number, values: number[]) => number = (function summingPathsToFactory () {
	const cache: Record<string, number> = {};
	return function summingPathsTo(target: number, values: number[]): number {
		const sortedValues = values.slice().sort();
		const cacheKey = `${target}:${sortedValues.join(",")}`;
		const existing = cache[cacheKey];
		if (existing !== undefined) {
			return existing;
		}
		let pathCount = 0;
		for (const value of sortedValues) {
			if (target === value) {
				pathCount++;
			} else if (value < target) {
				const remain = sortedValues.filter(v => v !== value);
				if (remain.length > 0) {
					pathCount += summingPathsTo(target - value, remain);
				}
			}
		}
		cache[cacheKey] = pathCount;
		return pathCount;
	};
})();

export const EVIDENCE_CARD_VALUES: EvidenceValue[] = range(1, 6);
export const MAX_POSSIBLE_EVIDENCE_VALUE: EvidenceValue = EVIDENCE_CARD_VALUES.reduce((p, c) => p + c, 0);

export const ALL_PATHS_TO: Record<number, EvidenceValue[][]> = (() => {
	const allPaths: Record<number, EvidenceValue[][]> = {};
	function calc(sumSoFar: number, used: EvidenceValue[], unused: EvidenceValue[]): void {
		for (const num of unused) {
			const sum = sumSoFar + num;
			const nums = used.slice();
			nums.push(num);
			if (!Array.isArray(allPaths[sum])) {
				allPaths[sum] = [];
			}
			allPaths[sum].push(nums);
			if (unused.length > 1) {
				calc(sum, nums, unused.filter(n => n !== num));
			}
		}
	}
	calc(0, [], EVIDENCE_CARD_VALUES);
	return allPaths;
})();
