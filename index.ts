import { Bot } from "./ts/Bot";
import { CASE_FILE_CARDS } from "./ts/CaseFileCard";
import { Game, GameState } from "./ts/Game";
import { SILENT_LOGGER } from "./ts/logger";
import { randomItem } from "./ts/randomItem";
import { range } from "./ts/range";
import { roundTo } from "./ts/roundTo";

let wins = 0;
let plays = 0;
let turns = 0;
for (let gameNum = 0; gameNum < 1000; gameNum++) {
	plays++;
	const game = new Game(randomItem(CASE_FILE_CARDS), range(1, 4).map(() => new Bot()), SILENT_LOGGER);
	while (game.state === GameState.Playing) {
		game.step();
	}
	if (game.state === GameState.Won) {
		wins++;
	}
	turns += game.turns;
}

console.log(`Won ${wins}/${plays}, with ${roundTo(turns/plays, 2)} turns/game.`);
