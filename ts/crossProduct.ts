export function crossProduct<T, U>(t: T[], u: U[]): [ T, U ][] {
	const result: [ T, U ][] = [];
	for (const tItem of t) {
		for (const uItem of u) {
			result.push([ tItem, uItem ]);
		}
	}
	return result;
}

export function pairedPermutations<T>(items: T[]): [ T, T ][] {
	const result: [ T, T ][] = [];
	for (let i = 0; i < items.length - 1; i++) {
		const left = items[i];
		const pairs = items.slice(i + 1).map(right => [ left, right ] as [ T, T ]);
		result.push(...pairs);
	}
	return result;
}
