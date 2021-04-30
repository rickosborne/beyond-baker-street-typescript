import { assistRatio, isAssisted } from "./AssistAction";
import { Bot } from "./Bot";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption } from "./BotTurn";
import { columnarNumber } from "./columnarNumber";
import { EliminateKnownUnusedValueEffect, EliminateUnusedTypeEffect } from "./EliminateStrategy";
import { EVIDENCE_CARD_VALUE_MAX } from "./EvidenceCard";
import { formatAction } from "./formatAction";
import { Logger, SILENT_LOGGER } from "./logger";
import { PursueDuplicateEffect } from "./PursueStrategy";
import { randomItem } from "./randomItem";
import { PseudoRNG } from "./rng";
import { TurnStart } from "./TurnStart";

export interface BotTurnEvaluator {
	selectOption(options: BotTurnOption[], bot: Bot, turnStart: TurnStart): BotTurnOption;
}

interface ScoredOption {
	option: BotTurnOption;
	score: number;
}

const HOLMES_MAX = 20;

const DEFAULT_SCORE_FROM_TYPE: Record<BotTurnEffectType, number> = {
	[BotTurnEffectType.Win]: 1000,
	[BotTurnEffectType.InvestigatePerfect]: 100,
	[BotTurnEffectType.PursueImpossible]: 50,
	[BotTurnEffectType.AssistExactEliminate]: 40,
	[BotTurnEffectType.PursueDuplicate]: 35,
	[BotTurnEffectType.EliminateKnownUnusedValue]: 30,
	[BotTurnEffectType.EliminateUnusedType]: 25,
	[BotTurnEffectType.AssistKnown]: 20,
	[BotTurnEffectType.InvestigateCorrectType]: 12,
	[BotTurnEffectType.EliminateSetsUpExact]: 10,
	[BotTurnEffectType.Confirm]: 8,
	[BotTurnEffectType.HolmesImpeded]: 8,
	[BotTurnEffectType.AssistImpossibleType]: 5,
	[BotTurnEffectType.AssistNarrow]: 3,
	[BotTurnEffectType.AssistNextPlayer]: 1,

	[BotTurnEffectType.InvestigateCorrectValue]: 0,

	[BotTurnEffectType.ImpossibleAdded]: -1,
	[BotTurnEffectType.EliminateUnknownValue]: -5,
	[BotTurnEffectType.HolmesProgress]: -8,
	[BotTurnEffectType.InvestigateMaybeBad]: -10,
	[BotTurnEffectType.InvestigateWild]: -12,
	[BotTurnEffectType.InvestigateBad]: -15,
	[BotTurnEffectType.EliminateUsedType]: -20,
	[BotTurnEffectType.PursueMaybe]: -25,
	[BotTurnEffectType.EliminateKnownUsedValue]: -30,
	[BotTurnEffectType.EliminateStompsExact]: -40,
	[BotTurnEffectType.EliminateWild]: -50,
	[BotTurnEffectType.MaybeLose]: -60,
	[BotTurnEffectType.PursuePossible]: -100,
	[BotTurnEffectType.Lose]: -1000,
};

export class BasicBotTurnEvaluator implements BotTurnEvaluator {
	private readonly scoreFromType: Record<BotTurnEffectType, number>;

	constructor(
		scoreFromTypeOverrides: Partial<Record<BotTurnEffectType, number>> = {},
		private readonly logger: Logger = SILENT_LOGGER,
	) {
		this.scoreFromType = Object.assign({}, DEFAULT_SCORE_FROM_TYPE, scoreFromTypeOverrides);
	}

	public formatScoredOptions(scored: ScoredOption[], bot: Bot, turnStart: TurnStart): string {
		const positive = scored.filter(s => s.score >= 0);
		const top5 = scored.filter((s, i) => i < 5);
		const toShow = positive.length > 0 ? positive : top5;
		const hidden = scored.length - toShow.length;
		const tail = hidden > 0 ? `\n  ... plus ${hidden} more options.` : "";
		return `  ${toShow.map(s => `${columnarNumber(s.score, 7, 1)}: ${formatAction(s.option.action, bot, turnStart)} [${s.option.effects.map(e => e.effectType).join(", ")}]`).join("\n  ")}${tail}`;
	}

	private scoreEffect(effect: BotTurnEffect, turnStart: TurnStart): number {
		const score = this.scoreFromType[effect.effectType];
		if (effect.effectType === BotTurnEffectType.HolmesProgress) {
			return turnStart.board.holmesLocation - HOLMES_MAX;
		} else if (effect.effectType === BotTurnEffectType.ImpossibleAdded) {
			return 0 - turnStart.board.impossibleCards.length;
		} else if (effect.effectType === BotTurnEffectType.EliminateUnusedType) {
			const highValue = (effect as EliminateUnusedTypeEffect).mysteryCard.probabilityOf(e => e.evidenceValue >= 4);
			return score * highValue;
		} else if (effect.effectType === BotTurnEffectType.EliminateKnownUnusedValue) {
			const evidenceValue = (effect as EliminateKnownUnusedValueEffect).evidenceValue;
			return score * ((EVIDENCE_CARD_VALUE_MAX + evidenceValue) / (EVIDENCE_CARD_VALUE_MAX * 2));
		} else if (isAssisted(effect)) {
			// Drag decreases with the amount of information revealed.
			return score - (Math.abs(score) * (1 - assistRatio(effect)));
		} else if (effect.effectType === BotTurnEffectType.PursueDuplicate) {
			// In case of ties, get rid of the larger target.
			return score + (effect as PursueDuplicateEffect).evidenceTarget;
		}
		return score;
	}

	private scoreEffects(effects: BotTurnEffect[], turnStart: TurnStart): number {
		return effects.map(e => this.scoreEffect(e, turnStart)).reduce((p, c) => p + c, 0);
	}

	public selectOption(options: BotTurnOption[], bot: Bot, turnStart: TurnStart): BotTurnOption {
		const scored: ScoredOption[] = options
			.map(option => ({
				option,
				score: this.scoreEffects(option.effects, turnStart),
			}))
			.sort((a, b) => b.score - a.score);
		this.logger.trace(`${bot.formatKnowledge(turnStart)}  Options:\n${this.formatScoredOptions(scored, bot, turnStart)}`);
		return scored[0].option;
	}
}

// noinspection JSUnusedGlobalSymbols
export class RandomBotTurnEvaluator implements BotTurnEvaluator {
	constructor(private readonly prng: PseudoRNG) {
	}

	public selectOption(options: BotTurnOption[]): BotTurnOption {
		return randomItem(options, this.prng);
	}
}

// noinspection JSUnusedGlobalSymbols
export const DEFAULT_BOT_TURN_EVALUATOR: BotTurnEvaluator = new BasicBotTurnEvaluator();
