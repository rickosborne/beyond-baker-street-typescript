import { Bot } from "./Bot";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { EffectWeightOpsFromType } from "./defaultScores";
import { Game, GameState } from "./Game";
import { SILENT_LOGGER } from "./logger";
import { range } from "./range";
import { DEFAULT_PRNG } from "./rng";

export function playSingleGame(weights: Partial<EffectWeightOpsFromType>, iterations = 200): number {
	let losses = 0;
	for (let i = 0; i < iterations; i++) {
		const game = new Game(CASE_FILE_CARDS[0], range(1, 4)
			.map(() => new Bot(SILENT_LOGGER, DEFAULT_PRNG, weights)));
		while (game.state === GameState.Playing) {
			game.step();
		}
		if (game.state === GameState.Lost) {
			losses++;
		}
	}
	return losses / iterations;
}
