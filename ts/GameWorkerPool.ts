import * as path from "path";
import { Worker } from "worker_threads";
import { cpus } from "os";
import { range } from "./range";
import { isPlayGameResult, PlayGameRequest, PlayGameResult } from "./WorkerTypes";
import { EffectWeightOpsFromType } from "./defaultScores";

type Consumer<T> = (item: T) => void;
type WorkerConsumer = Consumer<Worker>;
type PlayGameResultConsumer = Consumer<PlayGameResult>;

interface OnResult {
	withResult: PlayGameResultConsumer;
	withWorker: WorkerConsumer;
}

export class GameWorkerPool {
	private nextRequestId = 1;
	private readonly onWorkerQueue: WorkerConsumer[] = [];
	private readonly ready: Worker[] = [];
	private readonly requests: Record<number, OnResult> = {};
	private readonly workers: Worker[];

	constructor(
		threadCount: number = cpus().length,
	) {
		this.workers = range(1, threadCount).map(n => {
			const worker = new Worker(path.resolve(__dirname, "./workerShim.js"), {
				workerData: {
					path: path.resolve(__dirname, "./gameWorker.ts"),
					workerNum: n,
				},
			});
			// console.log(`Worker ${n} online`);
			worker.on("message", data => this.onResult(n, data, worker));
			worker.on("error", () => this.workerOffline(n, worker));
			worker.on("exit", () => this.workerOffline(n, worker));
			return worker;
		});
		this.ready.push(...this.workers);
	}

	private nextWorker(id: number): Promise<Worker> {
		const worker = this.ready.shift();
		if (worker != null) {
			// console.log(`Handing out ready worker for #${id}`);
			return Promise.resolve(worker);
		}
		return new Promise<Worker>((resolve) => {
			// console.log(`Queuing work for #${id}`);
			this.onWorkerQueue.push(worker => resolve(worker));
		});
	}

	private onResult(workerNum: number, result: unknown, worker: Worker): void {
		if (isPlayGameResult(result)) {
			// console.log(`withResult @${workerNum} #${result.request.id}`);
			const onResult = this.requests[result.request.id];
			onResult.withWorker(worker);
			onResult.withResult(result);
		} else {
			console.error(`Worker @${workerNum} gave back something unexpected: ${JSON.stringify(result)}`);
			this.workerOffline(workerNum, worker);
			throw new Error(`Unknown message back from worker ${workerNum}: ${JSON.stringify(result)}`);
		}
		this.workerAvailable(worker);
	}

	public scoreGame(weights: Partial<EffectWeightOpsFromType>, iterations?: number): Promise<PlayGameResult> {
		const id = this.nextRequestId++;
		const request: PlayGameRequest = {
			id,
			iterations,
			weights,
		};
		return new Promise((resolve) => {
			// console.log(`scoreGame registering ${id}`);
			this.requests[id] = {
				withResult: result => {
					// console.log(`withResult #${id}`);
					resolve(result);
				},
				withWorker: worker => {
					// console.log(`withWorker #${id}`);
					this.workerAvailable(worker);
				},
			};
			this.nextWorker(id).then(worker => {
				// console.log(`scoreGame sending ${id}`);
				worker.postMessage(request);
			});
		});
	}

	private workerAvailable(worker: Worker): void {
		const onWorker = this.onWorkerQueue.shift();
		if (onWorker != null) {
			onWorker(worker);
		} else {
			this.ready.push(worker);
		}
	}

	private workerOffline(workerNum: number, worker: Worker): void {
		console.log(`Worker ${workerNum} offline.`);
		const workerIndex = this.workers.indexOf(worker);
		this.ready.splice(workerIndex, 1);
		this.workers.splice(workerIndex, 1);
	}
}
