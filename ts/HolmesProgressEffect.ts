import { addEffect } from "./addEffect";
import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";
import { HOLMES_GOAL } from "./Game";
import { InspectorType } from "./InspectorType";
import { addLoseEffect } from "./LoseEffect";

export interface HolmesProgressEffect extends BotTurnEffect {
	delta: number;
	effectType: BotTurnEffectType.HolmesProgress;
}

export interface HolmesImpededEffect extends BotTurnEffect {
	delta: number;
	effectType: BotTurnEffectType.HolmesImpeded;
	inspector: InspectorType | undefined;
}

export function addHolmesProgressEffects(
	effects: BotTurnEffect[],
	delta: number,
	holmesLocation: number,
): void {
	addEffect<HolmesProgressEffect>(effects, {
		delta,
		effectType: BotTurnEffectType.HolmesProgress,
	});
	if (holmesLocation + delta <= HOLMES_GOAL) {
		addLoseEffect(effects);
	}
}
