export function groupBy<T, K extends string>(
	items: T[],
	keyExtractor: (item: T) => K,
): Record<K, T[]> {
	return items.reduce((result, item) => {
		const key = keyExtractor(item);
		if (!Array.isArray(result[key])) {
			result[key] = [];
		}
		result[key].push(item);
		return result;
	}, {} as Record<K, T[]>);
}
