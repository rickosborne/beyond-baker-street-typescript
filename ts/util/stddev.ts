import { mean } from "./mean";

export function stddev(items: number[], avg = mean(items)): number {
	if (items.length < 2) {
		return 0;
	}
	return Math.sqrt(mean(items.map(n => Math.pow(n - avg, 2))));
}
