function stableUnknown(obj: unknown): unknown {
	const type = typeof obj;
	if ((type === "undefined") || (type === "boolean") || (type === "string") || (type === "number") || (type === "bigint") || (type === "symbol")) {
		return obj;
	} else if (Array.isArray(obj)) {
		return obj.map(item => stableUnknown(item));
	} else {
		return stableObject(obj as Record<string, unknown>);
	}
}

function stableObject(obj: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	Object.keys(obj).sort().forEach(key => result[key] = stableUnknown(obj[key]));
	return result;
}

export function stableJson(obj: unknown, space?: number | string): string {
	return JSON.stringify(stableUnknown(obj), null, space);
}
