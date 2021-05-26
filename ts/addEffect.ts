import { BotTurnEffectType } from "./BotTurn";

export function addEffectsIfNotPresent(destination: BotTurnEffectType[], ...sources: BotTurnEffectType[]): void {
	destination.push(...sources.filter(s => !destination.includes(s)));
}

export function addEffectsEvenIfDuplicate(destination: BotTurnEffectType[], ...sources: BotTurnEffectType[]): void {
	destination.push(...sources);
}
