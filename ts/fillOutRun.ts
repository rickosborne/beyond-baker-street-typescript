import { idForWeights, SimRun } from "./SimRun";
import { Timer } from "./util/timer";

export function fillOutRun(toFix: SimRun, neighborOf: SimRun, timer: Timer | number | undefined): SimRun {
	toFix.neighborOf = neighborOf;
	if (toFix.id === undefined || toFix.id === "") {
		toFix.id = idForWeights(toFix.weights);
	}
	let elapsed: number | undefined;
	if (typeof timer === "function") {
		elapsed = timer();
	} else {
		elapsed = timer;
	}
	if (elapsed !== undefined) {
		if (toFix.msToFindNeighbor === undefined || toFix.msToFindNeighbor < elapsed) {
			toFix.msToFindNeighbor = elapsed;
		}
	}
	return toFix;
}
