import { addEffect } from "./addEffect";
import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";

export interface WinEffect extends BotTurnEffect {
    effectType: BotTurnEffectType.Win;
}

export function addWinEffect(effects: BotTurnEffect[]): void {
	addEffect<WinEffect>(effects, {
		effectType: BotTurnEffectType.Win,
	});
}
