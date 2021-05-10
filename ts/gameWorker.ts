import { isMainThread, parentPort, workerData } from "worker_threads";
import { formatThrowable } from "./formatThrowable";
import { formatTimestamp } from "./formatTimestamp";
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
			const logger = cachingLoggerFactory();
			let lossRate: number | undefined = undefined;
			let errors: string | undefined = undefined;
			try {
				const outcome = playSingleGame(request.weights, request.iterations, undefined, logger);
				lossRate = outcome.lossRate;
			} catch (e) {
				errors = `Worker crashed:\n${logger.messages.map(m => `${formatTimestamp(m.time)} [${m.level}] ${m.message}`).join("\n")}\n${formatThrowable(e)}`;
			}
			const result: PlayGameResult = {
				errors,
				lossRate,
				request,
			};
			pp.postMessage(result);
		} else {
			throw new Error(`Unknown message type for worker @${workerNum}: ${JSON.stringify(request)}`);
		}
	});
}
