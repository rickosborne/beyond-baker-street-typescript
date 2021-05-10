import { formatDecimal } from "./ts/formatDecimal";
import { formatPercent } from "./ts/formatPercent";
import { InspectorType } from "./ts/InspectorType";
import { buildLogger, LogLevel } from "./ts/logger";
import { playSingleGame } from "./ts/playSingleGame";
import { msTimer } from "./ts/timer";

const config = {
	gamesToPlay: 2500,
};
const elapsed = msTimer();
const infoOnly = buildLogger({
	[LogLevel.info]: true,
	[LogLevel.json]: false,
	[LogLevel.trace]: false,
});
const forceInspectors: InspectorType[] = [];  // [ InspectorType.Toby, InspectorType.Blackwell ];
const { losses, lossRate, plays, turnsAvg, turns } = playSingleGame({}, config.gamesToPlay, undefined, config.gamesToPlay === 1 ? infoOnly : undefined, undefined, forceInspectors);
if (plays === 1) {
	console.log(`${losses === 0 ? "Won" : "Lost"}, with ${turns} turns in ${elapsed()}ms.`);
} else {
	console.log(`Lost ${losses}/${plays} = ~${formatPercent(lossRate, 2)}, with ${formatDecimal(turnsAvg, 2)} turns/game, in ${elapsed()}ms.`);
}
