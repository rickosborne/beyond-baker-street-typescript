export function sum(items: number[]): number {
	return items.reduce((p, c) => p + c, 0);
}
