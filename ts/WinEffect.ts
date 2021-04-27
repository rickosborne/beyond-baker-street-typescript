import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";

export interface WinEffect extends BotTurnEffect {
    effectType: BotTurnEffectType.Win;
}
