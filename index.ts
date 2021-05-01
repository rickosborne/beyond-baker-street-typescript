import { Bot } from "./ts/Bot";
import { CASE_FILE_CARDS } from "./ts/CaseFileCard";
import { Game, GameState } from "./ts/Game";
import { CONSOLE_LOGGER, Logger, SILENT_LOGGER } from "./ts/logger";
import { range } from "./ts/range";
import { buildRNG } from "./ts/rng";
import { roundTo } from "./ts/roundTo";
import { msTimer } from "./ts/timer";

let wins = 0;
let plays = 0;
let turns = 0;
const config = {
	gamesToPlay: 1,
};
const logger: Logger = config.gamesToPlay === 1 ? CONSOLE_LOGGER : SILENT_LOGGER;
// const logger = cachingLoggerFactory();
const masterRNG = buildRNG(JSON.stringify(config));
const seeds = range(1, config.gamesToPlay).map(() => masterRNG());
const elapsed = msTimer();
for (let gameNum = 0; gameNum < config.gamesToPlay; gameNum++) {
	const prng = buildRNG(String(seeds[gameNum]));
	plays++;
	const game = new Game(CASE_FILE_CARDS[0], range(1, 4).map(() => new Bot(logger, prng)), prng, logger);
	while (game.state === GameState.Playing) {
		game.step();
	}
	if (game.state === GameState.Won) {
		wins++;
		// const jsons = logger.messages.filter(m => m.level === LogLevel.json);
		// console.log("\n-----\n" + jsons.map(m => JSON.stringify(m.message)).join("\n"));
	}
	turns += game.turns;
}
if (plays === 1) {
	console.log(`${wins === 1 ? "Won" : "Lost"}, with ${turns} turns in ${elapsed()}ms.`);
} else {
	console.log(`Won ${wins}/${plays}, with ${roundTo(turns/plays, 2)} turns/game, in ${elapsed()}ms.`);
}
