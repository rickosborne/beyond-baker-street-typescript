export function objectMap<K extends string, S, D>(source: Record<K, S>, mapper: (value: S, key: K, index: number, obj: Record<K, S>) => D): Record<K, D> {
	const result: Record<K, D> = {} as Record<K, D>;
	const keys: K[] = Object.keys(source) as K[];
	for (let i = 0; i < keys.length; i++) {
		const key: K = keys[i];
		const sourceValue: S = source[key];
		result[key] = mapper(sourceValue, key, i, source);
	}
	return result;
}
