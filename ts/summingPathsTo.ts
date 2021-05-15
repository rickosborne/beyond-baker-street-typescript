/**
 * Worst knapsack implementation ever.
 */
import { sum } from "./arrayMath";
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
		for (let i = 0; i < sortedValues.length; i++) {
			const value = sortedValues[i];
			if (target === value) {
				pathCount++;
			} else if (value < target) {
				const remain = sortedValues.slice(i + 1);
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
export const MAX_POSSIBLE_EVIDENCE_VALUE: EvidenceValue = sum(EVIDENCE_CARD_VALUES);

const ALL_PATHS_TO: Record<number, EvidenceValue[][]> = (() => {
	const allPaths: Record<number, EvidenceValue[][]> = {};
	function calc(sumSoFar: number, used: EvidenceValue[], unused: EvidenceValue[]): void {
		for (let i = 0; i < unused.length; i++) {
			const num = unused[i];
			const sum = sumSoFar + num;
			const nums = used.slice();
			nums.push(num);
			if (!Array.isArray(allPaths[sum])) {
				allPaths[sum] = [];
			}
			allPaths[sum].push(nums);
			if (unused.length > 1) {
				calc(sum, nums, unused.slice(i + 1));
			}
		}
	}
	calc(0, [], EVIDENCE_CARD_VALUES);
	return allPaths;
})();

export function allPathsTo(value: number): EvidenceValue[][] {
	return ALL_PATHS_TO[value] || [];
}
