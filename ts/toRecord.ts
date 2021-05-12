import { BiFunction, QuadFunction } from "./Function";

// noinspection JSUnusedLocalSymbols
export function toRecord<T, K extends string, V>(
	items: T[],
	keyMapper: BiFunction<T, number, K>,
	valueMapper: BiFunction<T, number, V>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onDuplicate: QuadFunction<V, V, K, number, V> = (updated, original, key, index) => updated,
): Record<K, V> {
	const result = {} as Record<K, V>;
	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		const key = keyMapper(item, index);
		let value = valueMapper(item, index);
		const existing = result[key];
		if (existing !== undefined) {
			value = onDuplicate(value, existing, key, index);
		}
		result[key] = value;
	}
	return result;
}
