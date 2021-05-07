export function formatDecimal(value: number | undefined, decimals = 1): string {
	const tens = Math.pow(10, decimals);
	return value === undefined ? "" : String(Math.round((value * tens)) / tens);
}
