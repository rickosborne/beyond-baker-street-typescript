export function sum(items: number[]): number {
	return items.reduce((p, c) => p + c, 0);
}

export function mean(items: number[]): number {
	return items.length > 0 ? sum(items) / items.length : 0;
}

export function stddev(items: number[], avg = mean(items)): number {
	if (items.length === 0) {
		return 0;
	}
	return Math.sqrt(mean(items.map(n => Math.pow(n - avg, 2))));
}
