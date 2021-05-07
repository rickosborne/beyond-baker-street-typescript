import { formatDecimal } from "./ts/formatDecimal";
import { formatPercent } from "./ts/formatPercent";
import { playSingleGame } from "./ts/playSingleGame";
import { msTimer } from "./ts/timer";

const config = {
	gamesToPlay: 1,
};
const elapsed = msTimer();
const { losses, lossRate, plays, turnsAvg, turns } = playSingleGame({}, config.gamesToPlay);
if (plays === 1) {
	console.log(`${losses === 0 ? "Won" : "Lost"}, with ${turns} turns in ${elapsed()}ms.`);
} else {
	console.log(`Lost ${losses}/${plays} = ~${formatPercent(lossRate, 2)}, with ${formatDecimal(turnsAvg, 2)} turns/game, in ${elapsed()}ms.`);
}
