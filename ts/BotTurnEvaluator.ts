import { BotTurnEffect, BotTurnEffectType, BotTurnOption } from "./BotTurn";
import { Logger, SILENT_LOGGER } from "./logger";
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
		[BotTurnEffectType.Win]: 1000,
		[BotTurnEffectType.InvestigatePerfect]: 100,
		[BotTurnEffectType.PursueImpossible]: 40,
		[BotTurnEffectType.EliminateKnownUnusedValue]: 30,
		[BotTurnEffectType.AssistKnown]: 20,
		[BotTurnEffectType.Confirm]: 8,
		[BotTurnEffectType.HolmesImpeded]: 8,
		[BotTurnEffectType.AssistNarrow]: 5,
		[BotTurnEffectType.InvestigateCorrectType]: 3,
		[BotTurnEffectType.InvestigateCorrectValue]: 0,

		[BotTurnEffectType.InvestigateWild]: -2,
		[BotTurnEffectType.EliminateUnknownValue]: -5,
		[BotTurnEffectType.HolmesProgress]: -8,
		[BotTurnEffectType.EliminateUnusedType]: -10,
		[BotTurnEffectType.InvestigateMaybeBad]: -10,
		[BotTurnEffectType.InvestigateBad]: -15,
		[BotTurnEffectType.EliminateUsedType]: -20,
		[BotTurnEffectType.PursueMaybe]: -25,
		[BotTurnEffectType.EliminateKnownUsedValue]: -30,
		[BotTurnEffectType.EliminateWild]: -50,
		[BotTurnEffectType.PursuePossible]: -60,
		[BotTurnEffectType.Lose]: -1000,
	};
	private readonly scoreFromType: Record<BotTurnEffectType, number>;

	constructor(
		scoreFromTypeOverrides: Partial<Record<BotTurnEffectType, number>> = {},
		private readonly logger: Logger = SILENT_LOGGER,
	) {
		this.scoreFromType = Object.assign({}, BasicBotTurnEvaluator.DEFAULT_SCORE_FROM_TYPE, scoreFromTypeOverrides);
	}

	private scoreEffect(effect: BotTurnEffect, turnStart: TurnStart): number {
		const score = this.scoreFromType[effect.effectType];
		if (effect.effectType === BotTurnEffectType.HolmesProgress) {
			return turnStart.board.holmesLocation - HOLMES_MAX;
		} else if (effect.effectType === BotTurnEffectType.AssistNarrow) {
			return score + (1.0 / (effect as NarrowCardEffect).remainingPossibilities);
		}
		return score;
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
		this.logger(`${turnStart.player.name} has options:\n\t${scored.map(s => `${s.score}: ${formatAction(s.option.action, turnStart)}`).join("\n\t")}`);
		return scored[0].option;
	}
}

// noinspection JSUnusedGlobalSymbols
export class RandomBotTurnEvaluator implements BotTurnEvaluator {
	public selectOption(options: BotTurnOption[]): BotTurnOption {
		return randomItem(options);
	}
}

export const DEFAULT_BOT_TURN_EVALUATOR: BotTurnEvaluator = new BasicBotTurnEvaluator();
