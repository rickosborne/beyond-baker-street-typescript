export function pairedPermutations<T>(items: T[]): [ T, T ][] {
	const result: [ T, T ][] = [];
	for (let i = 0; i < items.length - 1; i++) {
		const left = items[i];
		const pairs = items.slice(i + 1).map(right => [ left, right ] as [ T, T ]);
		result.push(...pairs);
	}
	return result;
}

export function pairedPermutations2<A, B>(aItems: A[], bItems: B[]): [ A, B ][] {
	const result: [ A, B ][] = [];
	for (let i = 0; i < aItems.length; i++) {
		const left = aItems[i];
		const pairs = bItems.map(right => [ left, right ] as [ A, B ]);
		result.push(...pairs);
	}
	return result;
}
