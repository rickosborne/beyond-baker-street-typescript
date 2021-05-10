import { BotTurnEffectType } from "./BotTurn";

export function addEffectsIfNotPresent(destination: BotTurnEffectType[], ...sources: BotTurnEffectType[]): void {
	for (const effect of sources) {
		if (!destination.includes(effect)) {
			destination.push(effect);
		}
	}
}

export function addEffectsEvenIfDuplicate(destination: BotTurnEffectType[], ...sources: BotTurnEffectType[]): void {
	for (const effect of sources) {
		destination.push(effect);
	}
}
