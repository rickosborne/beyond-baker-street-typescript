import { compareTwo, DataSetCompareResult } from "./DataSet";
import { formatOrderedEffectWeightOpsFromType } from "./defaultScores";
import { formatPercent } from "./format/formatPercent";
import { MonoFunction } from "./Function";
import { neighborIterator } from "./neighborIterator";
import { randomInt } from "./rng";
import { RunStorage } from "./RunStorage";
import { CompletedSimRun, SimRun, SimRunStats } from "./SimRun";
import { mean } from "./util/mean";
import { stableJson } from "./util/stableJson";
import { msTimer } from "./util/timer";

interface FinishedSimRun extends CompletedSimRun {
	neighbors: Iterator<SimRun, undefined, number>;
}

/**
 * Returns a random number [0,count-1] which is distributed toward 0.
 * @param {number} count
 */
function weightedRandomIndex(count: number): number {
	return (count - 1) - Math.floor(count * Math.pow(Math.random(), 1 / count));
}

/**
 * Meld the annealing concept of "best" and "last", while also accounting for uncertainty about "better".
 * It keeps a pool of candidates, sorted by energy, and provides neighbors based on those.
 */
export class Thermocouple {
	private readonly ignoreIds: Set<string> = new Set<string>();
	private readonly runs: FinishedSimRun[] = [];  // Sorted best (lowest) to worst (highest)

	constructor(
		private readonly storage: RunStorage,
		public readonly preferredMaxCount = 5,
		private readonly neighborIteratorFactory: MonoFunction<SimRun, Iterator<SimRun, undefined, number>> = neighborIterator(weights => storage.scoreForWeights(weights)),
	) {
	}

	public [Symbol.iterator](): Iterator<SimRun, undefined> {
		return {
			next: (): IteratorResult<SimRun, undefined> => {
				const value = this.neighbor(20);
				if (value === undefined) {
					return {
						done: true,
						value,
					};
				}
				return {
					done: false,
					value: value,
				};
			},
		};
	}

	public get finished(): CompletedSimRun[] {
		return this.runs.map(f => ({
			id: f.id,
			lossRate: f.lossRate,
			lossVariance: f.lossVariance,
			msToFindNeighbor: f.msToFindNeighbor,
			neighborDepth: f.neighborDepth,
			neighborOf: f.neighborOf,
			neighborSignature: f.neighborSignature,
			plays: f.plays,
			weights: f.weights,
		}));
	}

	public get mean(): SimRunStats {
		return {
			lossRate: mean(this.runs.map(r => r.lossRate), 1),
			lossVariance: mean(this.runs.map(r => r.lossVariance), -1),
			plays: mean(this.runs.map(r => r.plays)),
		};
	}

	public neighbor(temperature: number): SimRun | undefined {
		const timer = msTimer();
		while (this.runs.length > 0) {
			const index = weightedRandomIndex(this.runs.length);
			const finished = this.runs[index];
			const neighbor = finished.neighbors.next(temperature);
			if (neighbor.value === undefined) {
				console.warn(`Iterator for ${finished.id} ran out of neighbors.`);
				this.runs.splice(index, 1);
				this.ignoreIds.add(finished.id);
				// try to add the parent
				if (finished.neighborOf !== undefined && this.runs.findIndex(r => r.id === finished.neighborOf?.id) < 0) {
					const parent = this.storage.findAttemptById(finished.neighborOf.id);
					if (parent != null && this.register(parent)) {
						console.log(`Backing up to ${parent.id} at ${formatPercent(parent.lossRate, 2)}.`);
					}
				}
			} else {
				const withTime: SimRun = Object.create(neighbor.value);
				withTime.msToFindNeighbor = timer();
				return withTime;
			}
		}
		return undefined;
	}

	/**
	 * @return {boolean} Whether the run is "good enough" and kept as a source for neighbors.
	 */
	public register(run: SimRun): boolean {
		const { id, lossRate, lossVariance, msToFindNeighbor, neighborDepth, neighborOf, neighborSignature, plays, weights } = run;
		if (lossVariance === undefined || lossRate === undefined || plays === undefined) {
			console.warn(`Run had no stats: ${formatOrderedEffectWeightOpsFromType(run.weights)}`);
			return false;
		}
		if (this.ignoreIds.has(id)) {
			return false;
		}
		this.storage.addAttemptScore(id, stableJson(weights), lossRate, plays, lossVariance, neighborOf?.id, neighborDepth);
		let afterIndex: number | undefined = undefined;
		let beforeIndex: number | undefined = undefined;
		for (let i = this.runs.length - 1; i >= 0 && afterIndex === undefined; i--) {
			const existing = this.runs[i];
			const compareResult = compareTwo(existing.plays, existing.lossRate, existing.lossVariance, plays, lossRate, lossVariance);
			if (compareResult === DataSetCompareResult.OTHER_IS_LARGER) {
				afterIndex = i;
			} else if (compareResult === DataSetCompareResult.OTHER_IS_SMALLER) {
				beforeIndex = i;
			} else if (lossRate > existing.lossRate) {
				afterIndex = i;
			} else if (lossRate < existing.lossRate) {
				beforeIndex = i;
			}
		}
		if (afterIndex === undefined) {
			afterIndex = -1;
		}
		if (beforeIndex === undefined) {
			beforeIndex = this.runs.length;
		}
		if (afterIndex >= beforeIndex) {
			throw new Error(`Expected ${afterIndex} < ${beforeIndex}`);
		}
		if (afterIndex >= this.preferredMaxCount - 1) {
			return false;
		}
		const index = randomInt(beforeIndex, afterIndex + 1);
		const neighbors = this.neighborIteratorFactory(run);
		const finished: FinishedSimRun = {
			id,
			lossRate,
			lossVariance,
			msToFindNeighbor,
			neighborDepth,
			neighborOf,
			neighborSignature,
			neighbors,
			plays,
			weights,
		};
		this.runs.splice(index, 0, finished);
		if (this.runs.length > this.preferredMaxCount) {
			this.runs.splice(this.preferredMaxCount, this.runs.length - this.preferredMaxCount);
		}
		return true;
	}
}
