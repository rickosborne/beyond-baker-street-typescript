export function range(min: number, max: number): number[] {
	const result: number[] = new Array(max - min);
	for (let i: number = min, j = 0; i <= max; i++, j++) {
		result[j] = i;
	}
	return result;
}