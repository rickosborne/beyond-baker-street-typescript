import { isMainThread, parentPort, workerData } from "worker_threads";
import { playSingleGame } from "./playSingleGame";
import { isPlayGameRequest, PlayGameResult } from "./WorkerTypes";

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
