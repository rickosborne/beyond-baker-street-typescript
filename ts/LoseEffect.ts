import { addEffect } from "./addEffect";
import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";

export interface LoseEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.Lose;
}

export interface MaybeLoseEffect extends BotTurnEffect {
	chance: number;
	effectType: BotTurnEffectType.MaybeLose;
}

export function addLoseEffect(effects: BotTurnEffect[]): void {
	addEffect<LoseEffect>(effects, {
		effectType: BotTurnEffectType.Lose,
	});
}
