import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";

export interface HolmesProgressEffect extends BotTurnEffect {
	delta: number;
	effectType: BotTurnEffectType.HolmesProgress;
}

export interface HolmesImpededEffect extends BotTurnEffect {
	delta: number;
	effectType: BotTurnEffectType.HolmesImpeded;
}
