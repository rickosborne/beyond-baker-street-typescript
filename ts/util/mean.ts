import { sum } from "./sum";

export function mean(items: number[], defaultValue = 0): number {
	return items.length > 0 ? sum(items) / items.length : defaultValue;
}
