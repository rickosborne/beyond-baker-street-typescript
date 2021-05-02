import { Bot } from "./Bot";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption } from "./BotTurn";
import { columnarNumber } from "./columnarNumber";
import { DEFAULT_SCORE_FROM_TYPE } from "./defaultScores";
import { compileEffectWeight, EffectCalculator, EffectWeightOp } from "./EffectWeight";
import { formatAction } from "./formatAction";
import { Logger, SILENT_LOGGER } from "./logger";
import { objectMap } from "./objectMap";
import { randomItem } from "./randomItem";
import { PseudoRNG } from "./rng";
import { ScoredOption } from "./ScoredOption";
import { TurnStart } from "./TurnStart";

export interface BotTurnEvaluator {
	selectOption(options: BotTurnOption[], bot: Bot, turnStart: TurnStart): BotTurnOption;
}

interface BotEffectScore {
	formula: string;
	score: number;
}

export class BasicBotTurnEvaluator implements BotTurnEvaluator {
	private readonly scoreFromType: Record<BotTurnEffectType, EffectCalculator>;

	constructor(
		scoreFromTypeOverrides: Partial<Record<BotTurnEffectType, number>> = {},
		private readonly logger: Logger = SILENT_LOGGER,
	) {
		const opsFromType = Object.assign({}, DEFAULT_SCORE_FROM_TYPE, scoreFromTypeOverrides);
		this.scoreFromType = objectMap<BotTurnEffectType, EffectWeightOp[], EffectCalculator>(opsFromType, (ops, et) => compileEffectWeight(ops, et, this.logger !== SILENT_LOGGER));
	}

	public formatScoredOptions(scored: ScoredOption[], bot: Bot, turnStart: TurnStart): string {
		const positive = scored.filter(s => s.score >= 0);
		const top5 = scored.filter((s, i) => i < 5);
		const toShow = positive.length > 0 ? positive : top5;
		const hidden = scored.length - toShow.length;
		const tail = hidden > 0 ? `\n  ... plus ${hidden} more options.` : "";
		return `  ${toShow.map(s => `${columnarNumber(s.score, 7, 1)}: ${formatAction(s.option.action, bot, turnStart)} [${s.option.effects.map(e => e.effectType).join(", ")}] ${s.formula}`).join("\n  ")}${tail}`;
	}

	private scoreEffect(effect: BotTurnEffect, turnStart: TurnStart): BotEffectScore {
		const operation = this.scoreFromType[effect.effectType];
		return {
			formula: operation.format(effect, turnStart),
			score: operation.calculate(effect, turnStart),
		};
	}

	private scoreEffects(effects: BotTurnEffect[], turnStart: TurnStart): BotEffectScore {
		return effects.map(e => this.scoreEffect(e, turnStart)).reduce((p, c) => ({
			formula: p.formula === "" ? c.formula : `${p.formula} ++ ${c.formula}`,
			score: p.score + c.score,
		}), { formula: "", score: 0 });
	}

	public scoreOptions(options: BotTurnOption[], turnStart: TurnStart): ScoredOption[] {
		return options
			.map(option => {
				const score = this.scoreEffects(option.effects, turnStart);
				return {
					formula: score.formula,
					option,
					score: score.score,
				};
			});
	}

	public selectBestOption(scored: ScoredOption[], bot: Bot, turnStart: TurnStart): BotTurnOption {
		if (this.logger === SILENT_LOGGER) {
			return scored.reduce((prev, cur) => prev == null || prev.score < cur.score ? cur : prev, undefined as ScoredOption | undefined)?.option as BotTurnOption;
		} else {
			scored.sort((a, b) => b.score - a.score);
			this.logger.trace(() => `${bot.formatKnowledge(turnStart)}  Options:\n${this.formatScoredOptions(scored, bot, turnStart)}`);
			return scored[0].option;
		}
	}

	public selectOption(options: BotTurnOption[], bot: Bot, turnStart: TurnStart): BotTurnOption {
		const scored: ScoredOption[] = this.scoreOptions(options, turnStart);
		return this.selectBestOption(scored, bot, turnStart);
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
