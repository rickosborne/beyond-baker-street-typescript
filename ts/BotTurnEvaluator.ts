import { BotTurnEffect, BotTurnEffectType, BotTurnOption } from "./BotTurn";
import { randomItem } from "./randomItem";
import { TurnStart } from "./TurnStart";
import { formatAction } from "./formatAction";
import { NarrowCardEffect } from "./AssistStrategy";

export interface BotTurnEvaluator {
	selectOption(options: BotTurnOption[], turnStart: TurnStart): BotTurnOption;
}

interface ScoredOption {
	option: BotTurnOption;
	score: number;
}

const HOLMES_MAX = 20;

export class BasicBotTurnEvaluator implements BotTurnEvaluator {
	public static readonly DEFAULT_SCORE_FROM_TYPE: Record<BotTurnEffectType, number> = {
		[BotTurnEffectType.Confirm]: 10,
		[BotTurnEffectType.EliminateKnownUnusedValue]: 15,
		[BotTurnEffectType.EliminateKnownUsedValue]: -30,
		[BotTurnEffectType.EliminateUnknownValue]: -5,
		[BotTurnEffectType.EliminateUnusedType]: -10,
		[BotTurnEffectType.EliminateUsedType]: -20,
		[BotTurnEffectType.EliminateWild]: -50,
		[BotTurnEffectType.HolmesImpeded]: 10,
		[BotTurnEffectType.HolmesProgress]: -10,
		[BotTurnEffectType.KnownCard]: 5,
		[BotTurnEffectType.Lose]: -1000,
		[BotTurnEffectType.NarrowCard]: 1,
		[BotTurnEffectType.PursueImpossible]: 50,
		[BotTurnEffectType.PursueMaybe]: -25,
		[BotTurnEffectType.PursuePossible]: -60,
		[BotTurnEffectType.Win]: 1000,
	};
	private readonly scoreFromType: Record<BotTurnEffectType, number>;

	constructor(
		scoreFromTypeOverrides: Partial<Record<BotTurnEffectType, number>> = {},
	) {
		this.scoreFromType = Object.assign({}, BasicBotTurnEvaluator.DEFAULT_SCORE_FROM_TYPE, scoreFromTypeOverrides);
	}

	private scoreEffect(effect: BotTurnEffect, turnStart: TurnStart): number {
		if (effect.effectType === BotTurnEffectType.HolmesProgress) {
			return turnStart.board.holmesLocation - HOLMES_MAX;
		} else if (effect.effectType === BotTurnEffectType.NarrowCard) {
			return this.scoreFromType[effect.effectType] + (1.0 / (effect as NarrowCardEffect).remainingPossibilities);
		}
		return this.scoreFromType[effect.effectType];
	}

	private scoreEffects(effects: BotTurnEffect[], turnStart: TurnStart): number {
		return effects.map(e => this.scoreEffect(e, turnStart)).reduce((p, c) => p + c, 0);
	}

	public selectOption(options: BotTurnOption[], turnStart: TurnStart): BotTurnOption {
		const scored: ScoredOption[] = options
			.map(option => ({
				option,
				score: this.scoreEffects(option.effects, turnStart),
			}))
			.sort((a, b) => b.score - a.score);
		console.log(`${turnStart.player.name} has options:\n\t${scored.map(s => `${s.score}: ${formatAction(s.option.action, turnStart)}`).join("\n\t")}`);
		return scored[0].option;
	}
}

export class RandomBotTurnEvaluator implements BotTurnEvaluator {
	public selectOption(options: BotTurnOption[]): BotTurnOption {
		return randomItem(options);
	}
}

export const DEFAULT_BOT_TURN_EVALUATOR: BotTurnEvaluator = new BasicBotTurnEvaluator();
