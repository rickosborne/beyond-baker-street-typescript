/**
 * Worst knapsack implementation ever.
 */
export function canSumTo(target: number, values: number[]): boolean {
	for (const value of values) {
		if (target === value) {
			return true;
		}
		const remain = values.filter(v => v !== value);
		if (remain.length === 0 || value > target) {
			return false;
		}
		if (canSumTo(target - value, remain)) {
			return true;
		}
	}
	return false;
}
