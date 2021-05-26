import { compareTwo, DataSetCompareResult } from "./DataSet";
import { EffectWeightOpsFromType, formatOrderedEffectWeightOpsFromType } from "./defaultScores";
import { MonoFunction } from "./Function";
import { neighborIterator } from "./neighborIterator";
import { randomInt } from "./rng";
import { SimRun, SimRunStats } from "./SimRun";
import { mean } from "./util/mean";

interface FinishedSimRun extends Required<SimRun> {
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
	private readonly runs: FinishedSimRun[] = [];  // Sorted best (lowest) to worst (highest)

	constructor(
		statLookup: MonoFunction<Partial<EffectWeightOpsFromType>, number | undefined>,
		public readonly preferredMaxCount = 5,
		private readonly neighborIteratorFactory: MonoFunction<SimRun, Iterator<SimRun, undefined, number>> = neighborIterator(statLookup),
	) {
	}

	public [Symbol.iterator](): Iterator<SimRun, undefined> {
		return {
			next: (): IteratorResult<SimRun, undefined> => {
				return {
					done: false,
					value: this.neighbor(20),
				};
			},
		};
	}

	public get finished(): Required<SimRun>[] {
		return this.runs.map(f => ({
			lossRate: f.lossRate,
			lossVariance: f.lossVariance,
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

	public neighbor(temperature: number): SimRun {
		while (this.runs.length > 0) {
			const index = weightedRandomIndex(this.runs.length);
			const finished = this.runs[index];
			const neighbor = finished.neighbors.next(temperature);
			if (neighbor.value === undefined) {
				console.warn(`Iterator for weights ran out of neighbors: ${formatOrderedEffectWeightOpsFromType(finished.weights)}`);
				this.runs.splice(index, 1);
			} else {
				return neighbor.value;
			}
		}
		throw new Error(`Need at least 1 run`);
	}

	/**
	 * @return {boolean} Whether the run is "good enough" and kept as a source for neighbors.
	 */
	public register(run: SimRun): boolean {
		const { lossRate, lossVariance, plays, weights } = run;
		if (lossVariance === undefined || lossRate === undefined || plays === undefined) {
			console.warn(`Run had no stats: ${formatOrderedEffectWeightOpsFromType(run.weights)}`);
			return false;
		}
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
			lossRate,
			lossVariance,
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
