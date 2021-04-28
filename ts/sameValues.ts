export function sameValues(a: number[], b: number[]): boolean {
	return (a.length === b.length)
		&& (a.findIndex((av, ai) => av !== b[ai]) < 0);
}
