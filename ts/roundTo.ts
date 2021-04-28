export function roundTo(value: number, decimals: number): number {
	const tens = Math.pow(10, decimals);
	return Math.round(value * tens) / tens;
}
