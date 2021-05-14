export function enumKeys<E extends string>(enumType: Record<E, unknown>): E[] {
	return Object.values(enumType).filter(k => typeof k === "string") as E[];
}
