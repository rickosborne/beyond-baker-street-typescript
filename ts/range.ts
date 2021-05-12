export function range(min: number, max: number): number[] {
	const delta = max - min;
	const count = Math.abs(delta) + 1;
	const direction = delta > 0 ? 1 : -1;
	const result: number[] = new Array(count);
	for (let i: number = min, j = 0; j < count; i += direction, j++) {
		result[j] = i;
	}
	return result;
}
