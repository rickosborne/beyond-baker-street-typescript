import { isMainThread, parentPort, workerData } from "worker_threads";
import { Bot } from "./Bot";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { EffectWeightOpsFromType } from "./defaultScores";
import { Game, GameState } from "./Game";
import { SILENT_LOGGER } from "./logger";
import { range } from "./range";
import { DEFAULT_PRNG } from "./rng";
import { isPlayGameRequest, PlayGameResult } from "./WorkerTypes";

function playSingleGame(weights: Partial<EffectWeightOpsFromType>, iterations = 200): number {
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

if (isMainThread || parentPort == null) {
	console.log(`gameWorker main thread`);
} else {
	const workerNum: number = workerData.workerNum;
	console.log(`Worker: ${JSON.stringify(workerData)}`);
	const pp = parentPort;
	pp.on("message", function onWorkerMessage(request) {
		if (isPlayGameRequest(request)) {
			// console.log(`PlayGameRequest @${workerNum} #${request.id}`);
			const lossRate = playSingleGame(request.weights, request.iterations);
			const result: PlayGameResult = {
				lossRate,
				request,
			};
			pp.postMessage(result);
		} else {
			throw new Error(`Unknown message type for worker @${workerNum}: ${JSON.stringify(request)}`);
		}
	});
}
