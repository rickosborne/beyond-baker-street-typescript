import { addEffectsIfNotPresent } from "./addEffect";
import { BotTurnEffectType } from "./BotTurn";
import { HOLMES_GOAL } from "./Game";

export function addHolmesProgressEffects(
	effects: BotTurnEffectType[],
	delta: number,
	holmesLocation: number,
): void {
	addEffectsIfNotPresent(effects, BotTurnEffectType.HolmesProgress);
	if (holmesLocation + delta <= HOLMES_GOAL) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
	}
}
