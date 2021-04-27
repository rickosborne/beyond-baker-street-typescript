import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";

export interface HolmesProgressEffect extends BotTurnEffect {
	delta: number;
	effectType: BotTurnEffectType.HolmesProgress;
}
