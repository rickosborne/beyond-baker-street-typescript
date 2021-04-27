import { Game, GameState } from "./ts/Game";
import { randomItem } from "./ts/randomItem";
import { CASE_FILE_CARDS } from "./ts/CaseFileCard";
import { range } from "./ts/range";
import { Bot } from "./ts/Bot";

const game = new Game(randomItem(CASE_FILE_CARDS), range(1, 4).map(() => new Bot()));
while (game.state === GameState.Playing) {
	game.step();
}
console.log(game.state);
