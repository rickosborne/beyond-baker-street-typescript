import { Bot } from "./ts/Bot";
import { CASE_FILE_CARDS } from "./ts/CaseFileCard";
import { Game, GameState } from "./ts/Game";
import { cachingLoggerFactory, LogLevel } from "./ts/logger";
import { range } from "./ts/range";
import { buildRNG } from "./ts/rng";
import { roundTo } from "./ts/roundTo";

let wins = 0;
let plays = 0;
let turns = 0;
const config = {
	gamesToPlay: 1000,
};
// const logger: Logger = config.gamesToPlay === 1 ? CONSOLE_LOGGER : SILENT_LOGGER;
const masterRNG = buildRNG(JSON.stringify(config));
for (let gameNum = 0; gameNum < config.gamesToPlay; gameNum++) {
	const prng = buildRNG(String(masterRNG()));
	const logger = cachingLoggerFactory();
	plays++;
	const game = new Game(CASE_FILE_CARDS[0], range(1, 4).map(() => new Bot(logger, prng)), prng, logger);
	while (game.state === GameState.Playing) {
		game.step();
	}
	if (game.state === GameState.Won) {
		wins++;
		const jsons = logger.messages.filter(m => m.level === LogLevel.json);
		console.log("\n-----\n" + jsons.map(m => JSON.stringify(m.message)).join("\n"));
	}
	turns += game.turns;
}
if (plays === 1) {
	console.log(`${wins === 1 ? "Won" : "Lost"}, with ${turns} turns.`);
} else {
	console.log(`Won ${wins}/${plays}, with ${roundTo(turns/plays, 2)} turns/game.`);
}
