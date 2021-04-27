import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";

export interface LoseEffect extends BotTurnEffect {
    effectType: BotTurnEffectType.Lose;
}
