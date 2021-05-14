import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption } from "./BotTurn";
import { columnarNumber } from "./columnarNumber";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import { compileEffectWeight, EffectWeightFormula, EffectWeightFromTurn } from "./EffectWeight";
import { formatAction } from "./formatAction";
import { Logger, SILENT_LOGGER } from "./logger";
import { objectMap } from "./objectMap";
import { randomItem } from "./randomItem";
import { PseudoRNG } from "./rng";
import { ScoredOption } from "./ScoredOption";
import { TurnStart } from "./TurnStart";
import { HasVisibleBoard } from "./VisibleBoard";

export interface BotTurnEvaluator {
	scoreEffects(effects: BotTurnEffectType[], hasVisibleBoard: HasVisibleBoard): number;
	selectOption(options: BotTurnOption[], bot: Bot, hasVisibleBoard: HasVisibleBoard): BotTurnOption;
}

export class BasicBotTurnEvaluator implements BotTurnEvaluator {
	private readonly scoreFromType: Record<BotTurnEffectType, EffectWeightFromTurn>;

	constructor(
		scoreFromTypeOverrides: Partial<EffectWeightOpsFromType> = {},
		private readonly logger: Logger = SILENT_LOGGER,
	) {
		const opsFromType = Object.assign({}, DEFAULT_SCORE_FROM_TYPE, scoreFromTypeOverrides);
		this.scoreFromType = objectMap<BotTurnEffectType, EffectWeightFormula, EffectWeightFromTurn>(opsFromType, (ops) => compileEffectWeight(ops));
	}

	public formatScoredOptions(scored: ScoredOption[], bot: Bot, turnStart: TurnStart): string {
		const positive = scored.filter(s => s.score >= 0);
		const top5 = scored.filter((s, i) => i < 5);
		const toShow = positive.length > 0 ? positive : top5;
		const hidden = scored.length - toShow.length;
		const tail = hidden > 0 ? `\n  ... plus ${hidden} more options.` : "";
		//  ${s.formula}
		return `  ${toShow.map(s => `${columnarNumber(s.score, 7, 1)}: ${formatAction(s.option.action, bot, turnStart)} [${s.option.effects.join(", ")}]`).join("\n  ")}${tail}`;
	}

	private scoreEffect(effect: BotTurnEffectType, hasVisibleBoard: HasVisibleBoard): number {
		const operation = this.scoreFromType[effect];
		return operation(hasVisibleBoard);
	}

	public scoreEffects(effects: BotTurnEffectType[], hasVisibleBoard: HasVisibleBoard): number {
		return effects.map(e => this.scoreEffect(e, hasVisibleBoard)).reduce((p, c) => p + c, 0);
	}

	public scoreOptions(options: BotTurnOption[], hasVisibleBoard: HasVisibleBoard): ScoredOption[] {
		return options
			.map(option => {
				const score = this.scoreEffects(option.effects, hasVisibleBoard);
				return {
					option,
					score,
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

	scoreEffects(): number {
		return Math.random();
	}

	public selectOption(options: BotTurnOption[]): BotTurnOption {
		return randomItem(options, this.prng);
	}
}

// noinspection JSUnusedGlobalSymbols
export const DEFAULT_BOT_TURN_EVALUATOR: BotTurnEvaluator = new BasicBotTurnEvaluator();
