import { Bot } from "./Bot";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { EffectWeightOpsFromType } from "./defaultScores";
import { Game, GameState } from "./Game";
import { INSPECTOR_TYPES, InspectorType } from "./InspectorType";
import { CONSOLE_LOGGER_NO_JSON, Logger, SILENT_LOGGER } from "./logger";
import { range } from "./range";
import { removeIf } from "./removeIf";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { shuffleInPlace } from "./shuffle";

export interface SingleGameOutcome {
	readonly lossRate: number;
	readonly losses: number;
	readonly plays: number;
	readonly turns: number;
	readonly turnsAvg: number;
}

export function playSingleGame(
	weights: Partial<EffectWeightOpsFromType>,
	plays = 200,
	prng: PseudoRNG = DEFAULT_PRNG,
	logger: Logger = plays === 1 ? CONSOLE_LOGGER_NO_JSON : SILENT_LOGGER,
	botCount = 4,
	forceInspectors: InspectorType[] = [],
): SingleGameOutcome {
	let losses = 0;
	let turns = 0;
	for (let i = 0; i < plays; i++) {
		const inspectors = shuffleInPlace(INSPECTOR_TYPES.slice(), prng);
		forceInspectors.forEach(f => {
			removeIf(inspectors, i => f === i);
			inspectors.unshift(f);
		});
		const bots = range(1, botCount)
			.map(() => new Bot(logger, prng, weights, inspectors.shift()));
		const game = new Game(CASE_FILE_CARDS[0], bots, prng, logger);
		while (game.state === GameState.Playing) {
			game.step();
		}
		if (game.state === GameState.Lost) {
			losses++;
		}
		turns += game.turns;
	}
	const lossRate = losses / plays;
	const turnsAvg = turns / plays;
	return {
		lossRate,
		losses,
		plays,
		turns,
		turnsAvg,
	};
}
