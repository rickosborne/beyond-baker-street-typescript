export function toRecord<T, K extends string, V>(
	items: T[],
	keyMapper: (item: T) => K,
	valueMapper: (item: T) => V,
): Record<K, V> {
	const result = {} as Record<K, V>;
	for (const item of items) {
		result[keyMapper(item)] = valueMapper(item);
	}
	return result;
}
