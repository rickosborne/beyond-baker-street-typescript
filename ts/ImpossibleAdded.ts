import { addEffectsIfNotPresent } from "./addEffect";
import { BotTurnEffectType, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { HOLMES_MOVE_PROGRESS } from "./Game";
import { addHolmesProgressEffects } from "./HolmesProgressEffect";
import { InspectorType } from "./InspectorType";
import { HasVisibleBoard } from "./VisibleBoard";

export function addImpossibleAddedEffects(
	effects: BotTurnEffectType[],
	impossibleCount: number,
	impossibleLimit: number,
	holmesLocation: number,
	cardType: CardType,
	strategy: BotTurnStrategyType,
	inspector: InspectorType | undefined,
): void {
	if (inspector === InspectorType.Wiggins && cardType === CardType.Lead && strategy === BotTurnStrategyType.Pursue) {
		// Wiggins does not add the pursued Lead to the Impossible
	} else {
		addEffectsIfNotPresent(effects, BotTurnEffectType.ImpossibleAdded);
	}
	if (impossibleCount + 1 > impossibleLimit) {
		if (inspector === InspectorType.Lestrade && strategy === BotTurnStrategyType.Eliminate && cardType === CardType.Evidence) {
			// Lestrade does not advance Holmes when eliminating evidence
			return;
		}
		addHolmesProgressEffects(effects, HOLMES_MOVE_PROGRESS, holmesLocation);
	}
}

export function addImpossibleAddedEffectsFromTurn(
	effects: BotTurnEffectType[],
	turn: HasVisibleBoard,
	cardType: CardType,
	strategy: BotTurnStrategyType,
	inspector: InspectorType | undefined
): void {
	addImpossibleAddedEffects(effects, turn.board.impossibleCards.length, turn.board.impossibleLimit, turn.board.holmesLocation, cardType, strategy, inspector);
}
