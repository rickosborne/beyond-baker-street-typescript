import { Bot } from "./Bot";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { DataSet } from "./DataSet";
import { EffectWeightOpsFromType } from "./defaultScores";
import { isDefined } from "./util/defined";
import { Game, GameState, LossReason } from "./Game";
import { INSPECTOR_TYPES, InspectorType } from "./InspectorType";
import { CONSOLE_LOGGER_NO_JSON, Logger, SILENT_LOGGER } from "./logger";
import { range } from "./util/range";
import { removeIf } from "./util/removeIf";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { shuffleInPlace } from "./util/shuffle";

export interface SingleGameOutcome {
	readonly lossRate: number;
	readonly lossReasons: Partial<Record<LossReason, number>>;
	readonly lossVariance: number;
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
	const lossNums: number[] = [];
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
		const didLose = game.state === GameState.Lost;
		lossNums.push(didLose ? 0 : 1);  // the mean should equal lossRate
		if (didLose) {
			losses++;
			const lossReason = game.lossReason;
			if (isDefined(lossReason)) {
				const existing = lossReasons[lossReason];
				lossReasons[lossReason] = (isDefined(existing) ? existing : 0) + 1;
			}
		}
		turns += game.turns;
	}
	const lossVariance = new DataSet(lossNums).sampleVariance;
	const lossRate = losses / plays;
	const turnsAvg = turns / plays;
	return {
		lossRate,
		lossReasons,
		lossVariance,
		losses,
		plays,
		turns,
		turnsAvg,
	};
}
