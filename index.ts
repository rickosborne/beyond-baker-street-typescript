import * as process from "process";
import { formatDecimal } from "./ts/format/formatDecimal";
import { formatLossReasons } from "./ts/format/formatLossReasons";
import { formatPercent } from "./ts/format/formatPercent";
import { InspectorType } from "./ts/InspectorType";
import { buildLogger, LogLevel } from "./ts/logger";
import { playSingleGame } from "./ts/playSingleGame";
import { msTimer } from "./ts/util/timer";

const isDebug = (process.env.NODE_OPTIONS || "").toLowerCase().includes("debug");
const config = {
	cheat: false,
	gamesToPlay: isDebug ? 1 : 2500,
};
const elapsed = msTimer();
const infoOnly = buildLogger({
	[LogLevel.info]: true,
	[LogLevel.json]: false,
	[LogLevel.trace]: isDebug,
});
const forceInspectors: InspectorType[] = [];  // [ InspectorType.Toby, InspectorType.Blackwell ];
const { losses, lossReasons, lossRate, plays, turnsAvg, turns } = playSingleGame({}, config.cheat, config.gamesToPlay, undefined, config.gamesToPlay === 1 ? infoOnly : undefined, undefined, forceInspectors, []);
if (plays === 1) {
	console.log(`${losses === 0 ? "Won" : "Lost"}, with ${turns} turns in ${elapsed()}ms.`);
} else {
	console.log(`Lost ${losses}/${plays} = ~${formatPercent(lossRate, 2)}, with ${formatDecimal(turnsAvg, 2)} turns/game, in ${elapsed()}ms.  Loss reasons: ${formatLossReasons(lossReasons, plays)}.`);
}
