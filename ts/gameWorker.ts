import { isMainThread, parentPort, workerData } from "worker_threads";
import { formatThrowable } from "./format/formatThrowable";
import { formatTimestamp } from "./format/formatTimestamp";
import { LossReason } from "./Game";
import { cachingLoggerFactory } from "./logger";
import { playSingleGame } from "./playSingleGame";
import { isPlayGameRequest, PlayGameResult } from "./WorkerTypes";

if (isMainThread || parentPort == null) {
	console.log(`gameWorker main thread`);
} else {
	const workerNum: number = workerData.workerNum;
	// console.log(`Worker: ${JSON.stringify(workerData)}`);
	const pp = parentPort;
	pp.on("message", function onWorkerMessage(request) {
		if (isPlayGameRequest(request)) {
			// console.log(`PlayGameRequest @${workerNum} #${request.id}`);
			const logger = cachingLoggerFactory({
				info: true,
				json: false,
				trace: false,
			});
			let lossRate = 1;
			let errors: string | undefined = undefined;
			let lossReasons: Partial<Record<LossReason, number>> = {};
			let lossVariance = 1;
			let plays = 0;
			try {
				const outcome = playSingleGame(request.weights, request.cheat, request.iterations, undefined, logger);
				lossRate = outcome.lossRate;
				lossReasons = outcome.lossReasons;
				lossVariance = outcome.lossVariance;
				plays = outcome.plays;
			} catch (e) {
				errors = `Worker crashed:\n${logger.messages.map(m => `${formatTimestamp(m.time)} [${m.level}] ${m.message}`).join("\n")}\n${formatThrowable(e)}`;
			}
			const result: PlayGameResult = {
				errors,
				lossRate,
				lossReasons,
				lossVariance,
				plays,
				request,
			};
			pp.postMessage(result);
		} else {
			throw new Error(`Unknown message type for worker @${workerNum}: ${JSON.stringify(request)}`);
		}
	});
}
