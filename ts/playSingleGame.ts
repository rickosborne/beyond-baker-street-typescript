import { Bot } from "./Bot";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { EffectWeightOpsFromType } from "./defaultScores";
import { isDefined } from "./defined";
import { Game, GameState, LossReason } from "./Game";
import { INSPECTOR_TYPES, InspectorType } from "./InspectorType";
import { CONSOLE_LOGGER_NO_JSON, Logger, SILENT_LOGGER } from "./logger";
import { range } from "./range";
import { removeIf } from "./removeIf";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { shuffleInPlace } from "./shuffle";

export interface SingleGameOutcome {
	readonly lossRate: number;
	readonly lossReasons: Partial<Record<LossReason, number>>;
	readonly losses: number;
	readonly plays: number;
	readonly turns: number;
	readonly turnsAvg: number;
}

export function playSingleGame(
	weights: Partial<EffectWeightOpsFromType>,
	cheat = false,
	plays = 200,
	prng: PseudoRNG = DEFAULT_PRNG,
	logger: Logger = plays === 1 ? CONSOLE_LOGGER_NO_JSON : SILENT_LOGGER,
	botCount = 4,
	forceInspectors: InspectorType[] = [],
	availableInspectors: InspectorType[] = INSPECTOR_TYPES,
): SingleGameOutcome {
	let losses = 0;
	let turns = 0;
	const lossReasons: Partial<Record<LossReason, number>> = {};
	for (let i = 0; i < plays; i++) {
		const inspectors = shuffleInPlace(availableInspectors.slice(), prng);
		forceInspectors.forEach(f => {
			removeIf(inspectors, i => f === i);
			inspectors.unshift(f);
		});
		const bots = range(1, botCount)
			.map(() => new Bot(cheat, logger, prng, weights, inspectors.shift()));
		const game = new Game(CASE_FILE_CARDS[0], bots, prng, logger);
		while (game.state === GameState.Playing) {
			game.step();
		}
		if (game.state === GameState.Lost) {
			losses++;
			const lossReason = game.lossReason;
			if (isDefined(lossReason)) {
				const existing = lossReasons[lossReason];
				lossReasons[lossReason] = (isDefined(existing) ? existing : 0) + 1;
			}
		}
		turns += game.turns;
	}
	const lossRate = losses / plays;
	const turnsAvg = turns / plays;
	return {
		lossRate,
		lossReasons,
		losses,
		plays,
		turns,
		turnsAvg,
	};
}
