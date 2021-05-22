import { T_DIST_ALPHA_DEFAULT, tScore } from "./tScore";

export enum DataSetCompareResult {
	OTHER_IS_SMALLER = -1,
	INDETERMINATE = 0,
	OTHER_IS_LARGER = 1,
}

export function tTestTwo(
	size1: number,
	mean1: number,
	variance1: number,
	size2: number,
	mean2: number,
	variance2: number,
	difference = 0,
): number {
	const weightedVariance = (((size1 - 1) * variance1) + ((size2 - 1) * variance2)) / (size1 + size2 - 2);
	return (mean1 - mean2 - difference) / Math.sqrt(weightedVariance * ((1 / size1) + (1 / size2)));
}

export function twoSampleDF(
	size1: number,
	variance1: number,
	size2: number,
	variance2: number,
): number {
	const s1sn1 = variance1 / size1;
	const s2sn2 = variance2 / size2;
	const num = s1sn1 + s2sn2;
	return (num * num) / (((s1sn1 * s1sn1) / (size1 - 1)) + ((s2sn2 * s2sn2) / (size2 - 1)));
}

export function compareTwo(
	size1: number,
	mean1: number,
	variance1: number,
	size2: number,
	mean2: number,
	variance2: number,
	alpha = T_DIST_ALPHA_DEFAULT,
	difference = 0,
): DataSetCompareResult {
	const T = tTestTwo(size1, mean1, variance1, size2, mean2, variance2, difference);
	const v = Math.round(twoSampleDF(size1, variance1, size2, variance2));
	const tHalf = tScore(v, alpha / 2, false);
	const tFull = tScore(v, alpha, false);
	const meansDifferent = Math.abs(T) > tHalf;
	const otherNotGreater = T > tFull;
	const otherNotLesser = T < -tFull;
	if (meansDifferent && !otherNotLesser && otherNotGreater) {
		return DataSetCompareResult.OTHER_IS_SMALLER;
	} else if (meansDifferent && !otherNotGreater && otherNotLesser) {
		return DataSetCompareResult.OTHER_IS_LARGER;
	}
	return DataSetCompareResult.INDETERMINATE;
}

export class DataSet {
	private _mean: number | undefined;
	private _sampleStandardDeviation: number | undefined;
	private _sampleVariance: number | undefined;
	private _sum: number | undefined;
	private _sumSquareDeviations: number | undefined;
	private readonly data: number[];
	public readonly degreesOfFreedom: number;
	public readonly length: number;

	constructor(data: number[]) {
		this.data = data.slice();
		this.length = data.length;
		this.degreesOfFreedom = this.length - 1;
	}

	public [Symbol.iterator](): IterableIterator<number> {
		return this.data[Symbol.iterator]();
	}

	public compareWith(other: DataSet, alpha = T_DIST_ALPHA_DEFAULT): DataSetCompareResult {
		return compareTwo(this.length, this.mean, this.sampleVariance, other.length, other.mean, other.sampleVariance, alpha);
	}

	public map(fn: (n: number) => number): DataSet {
		return new DataSet(this.data.map(fn));
	}

	public get mean(): number {
		if (this._mean === undefined) {
			this._mean = this.sum / this.length;
		}
		return this._mean;
	}

	public get sampleStandardDeviation(): number {
		if (this._sampleStandardDeviation === undefined) {
			this._sampleStandardDeviation = Math.sqrt(this.sampleVariance);
		}
		return this._sampleStandardDeviation;
	}

	public get sampleVariance(): number {
		if (this._sampleVariance === undefined) {
			if (this.data.length < 2) {
				throw new Error(`Sample variance requires at least 2 data points.`);
			}
			this._sampleVariance = this.sumSquareDeviations / (this.length - 1);
		}
		return this._sampleVariance;
	}

	public get sumSquareDeviations(): number {
		if (this._sumSquareDeviations === undefined) {
			const m = this.mean;
			this._sumSquareDeviations = this.data.reduce((p, c) => p + ((c - m) * (c - m)), 0);
		}
		return this._sumSquareDeviations;
	}

	public get sum(): number {
		if (this._sum === undefined) {
			this._sum = this.data.reduce((p, c) => p + c, 0);
		}
		return this._sum;
	}

	public tTestTwo(other: DataSet, difference = 0): number {
		return tTestTwo(this.length, this.mean, this.sampleVariance, other.length, other.mean, other.sampleVariance, difference);
	}
}
