import { cpus } from "os";
import * as path from "path";
import { Worker } from "worker_threads";
import { Consumer } from "./Consumer";
import { EffectWeightOpsFromType } from "./defaultScores";
import { LossReason } from "./Game";
import { SimRun } from "./SimRun";
import { parallelMap } from "./util/parallelMap";
import { playSingleGame } from "./playSingleGame";
import { range } from "./util/range";
import { isPlayGameResult, PlayGameRequest, PlayGameResult } from "./WorkerTypes";

type WorkerConsumer = Consumer<Worker>;
type PlayGameResultConsumer = Consumer<PlayGameResult>;

interface OnResult {
	withResult: PlayGameResultConsumer;
	withWorker: WorkerConsumer;
}

export interface GameSetup extends SimRun {
	cheat: boolean;
	iterations?: number;
}

export class GameWorkerPool {
	private nextRequestId = 1;
	private readonly onWorkerQueue: WorkerConsumer[] = [];
	private readonly ready: Worker[] = [];
	private readonly requests: Record<number, OnResult> = {};
	private readonly workers: Worker[];

	constructor(
		public readonly threadCount: number = cpus().length,
	) {
		this.workers = threadCount > 0 ? range(1, threadCount).map(n => {
			const worker = new Worker(path.resolve(__dirname, "./workerShim.js"), {
				workerData: {
					path: path.resolve(__dirname, "./gameWorker.ts"),
					workerNum: n,
				},
			});
			// console.log(`Worker ${n} online`);
			worker.on("message", data => this.onResult(n, data, worker));
			worker.on("error", err => this.workerOffline(n, worker, err));
			worker.on("exit", () => this.workerOffline(n, worker));
			return worker;
		}) : [];
		this.ready.push(...this.workers);
	}

	private nextWorker(/* id: number */): Promise<Worker> {
		const worker = this.ready.shift();
		if (worker != null) {
			// console.log(`Handing out ready worker for #${id}`);
			return Promise.resolve<Worker>(worker);
		}
		return new Promise<Worker>((resolve) => {
			// console.log(`Queuing work for #${id}`);
			this.onWorkerQueue.push(worker => resolve(worker));
		});
	}

	private onResult(workerNum: number, result: unknown, worker: Worker): void {
		if (isPlayGameResult(result)) {
			if (result.errors != null) {
				console.error(result.errors);
			}
			// console.log(`withResult @${workerNum} #${result.request.id}`);
			const onResult = this.requests[result.request.sequenceId];
			delete this.requests[result.request.sequenceId];
			onResult.withWorker(worker);
			onResult.withResult(result);
		} else {
			console.error(`Worker @${workerNum} gave back something unexpected: ${JSON.stringify(result)}`);
			this.workerOffline(workerNum, worker);
			throw new Error(`Unknown message back from worker ${workerNum}: ${JSON.stringify(result)}`);
		}
		this.workerAvailable(worker);
	}

	public scoreGame(
		id: string,
		weights: Partial<EffectWeightOpsFromType>,
		cheat: boolean, iterations: number | undefined,
		neighborOf: SimRun | undefined,
		msToFindNeighbor: number | undefined,
		neighborDepth: number,
		neighborSignature: string,
	): Promise<PlayGameResult> {
		const sequenceId = this.nextRequestId++;
		const request: PlayGameRequest = {
			cheat,
			id,
			iterations,
			msToFindNeighbor,
			neighborDepth,
			neighborOf,
			neighborSignature,
			sequenceId,
			weights,
		};
		return new Promise<PlayGameResult>((resolve) => {
			if (this.threadCount === 0) {
				let errors: string | undefined = undefined;
				let lossRate = 1;
				let lossReasons: Partial<Record<LossReason, number>> = {};
				let lossVariance = 1;
				let plays = 0;
				try {
					const outcome = playSingleGame(weights, cheat, iterations);
					lossRate = outcome.lossRate;
					lossReasons = outcome.lossReasons;
					lossVariance = outcome.lossVariance;
					plays = outcome.plays;
				} catch (e) {
					errors = String(e);
				}
				resolve({
					errors,
					lossRate,
					lossReasons,
					lossVariance,
					plays,
					request,
				});
				return;
			}
			// console.log(`scoreGame registering ${id}`);
			this.requests[sequenceId] = {
				withResult: result => {
					// console.log(`withResult #${id}`);
					resolve(result);
				},
				withWorker: worker => {
					// console.log(`withWorker #${id}`);
					this.workerAvailable(worker);
				},
			};
			this.nextWorker(/* id */).then(worker => {
				// console.log(`scoreGame sending ${id}`);
				worker.postMessage(request);
			});
		});
	}

	public async scoreGames(
		setups: Iterator<GameSetup, undefined>,
		eachResult?: Consumer<PlayGameResult> | undefined
	): Promise<void> {
		await parallelMap<GameSetup, PlayGameResult>(setups, this.threadCount, (setup) => {
			if (setup.lossRate !== undefined && setup.lossVariance !== undefined && setup.plays !== undefined) {
				return {
					errors: undefined,
					lossRate: setup.lossRate,
					lossReasons: {},
					lossVariance: setup.lossVariance,
					plays: setup.plays,
					request: {
						cheat: setup.cheat,
						id: setup.id,
						iterations: setup.iterations,
						msToFindNeighbor: setup.msToFindNeighbor,
						neighborDepth: setup.neighborDepth,
						neighborOf: setup.neighborOf,
						neighborSignature: setup.neighborSignature,
						sequenceId: -1,
						weights: setup.weights,
					},
				};
			} else {
				return this.scoreGame(setup.id, setup.weights, setup.cheat, setup.iterations, setup.neighborOf, setup.msToFindNeighbor, setup.neighborDepth, setup.neighborSignature);
			}
		}, eachResult);
	}

	public shutdown(): void {
		for (const worker of this.workers) {
			this.workerOffline(-1, worker);
		}
	}

	private workerAvailable(worker: Worker): void {
		const onWorker = this.onWorkerQueue.shift();
		if (onWorker != null) {
			onWorker(worker);
		} else {
			this.ready.push(worker);
		}
	}

	private workerOffline(workerNum: number, worker: Worker, error?: Error): void {
		if (error != null) {
			console.error(error);
		} else {
			console.log(`Worker ${workerNum} offline.`);
		}
		const workerIndex = this.workers.indexOf(worker);
		this.ready.splice(workerIndex, 1);
		this.workers.splice(workerIndex, 1);
		worker.terminate().catch(err => console.error(err));
	}
}
