import { Action } from "./Action";
import { BotTurnOption } from "./BotTurn";

export type Comparator<T> = (first: T, second: T) => number;

export enum CompareResult {
	First = -1,
	Same = 0,
	Second = 1,
}

export function reduceOptions<O extends BotTurnOption & { action: A }, A extends Action>(
	options: O[],
	comparator: Comparator<A>,
): O[] {
	const best = options.reduce((state, option) => {
		const key = option.effects.sort().join(",");
		const existing = state[key];
		if (existing == null || comparator(existing.action, option.action) > 0) {
			state[key] = option;
		}
		return state;
	}, {} as Record<string, O>);
	return Object.values(best);
}
