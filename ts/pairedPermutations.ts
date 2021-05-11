export function pairedPermutations<T>(items: T[]): [ T, T ][] {
	const result: [ T, T ][] = [];
	for (let i = 0; i < items.length - 1; i++) {
		const left = items[i];
		const pairs = items.slice(i + 1).map(right => [ left, right ] as [ T, T ]);
		result.push(...pairs);
	}
	return result;
}
