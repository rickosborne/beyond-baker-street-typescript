export function withinDecimals(a: number, b: number, decimals: number): boolean {
	const epsilon = Math.pow(10, 0 - decimals);
	return Math.abs(a - b) <= epsilon;
}
