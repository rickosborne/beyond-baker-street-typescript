import { BotTurnEffect } from "./BotTurn";
import { strictDeepEqual } from "./strictDeepEqual";

export function addEffect<E extends BotTurnEffect>(effects: BotTurnEffect[], effect: E): void {
	const existing = effects.find(e => e.effectType === effect.effectType);
	if (existing == null) {
		effects.push(effect);
	} else if (!strictDeepEqual(effect, existing)) {
		throw new Error(`Differing effects with the same types:\n${JSON.stringify(existing)}\n${JSON.stringify(effect)}`);
	}
}
