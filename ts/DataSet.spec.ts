import { expect } from "chai";
import { describe, it } from "mocha";
import { DataSet, DataSetCompareResult } from "./DataSet";
import { Callable } from "./Function";

const short = [ 1, 2, 3 ];
const low = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const neg = low.map(n => -n);
const mid = low.map(n => n + 1);
const high = low.map(n => n * 10);
const straddle = low.map(n => n - 5);
const lowSampleStdDev = 2.73861278753;
const lowSampleVariance = 7.5;
// Squares:   1   4   9  16  25  36  49  64  81
// (n-mean): -4  -3  -2  -1   0   1   2   3   4
// (n-m)^2:  16   9   4   1   0   1   4   9  16  => 60
const lowSumSquareDeviations = 60;

function twice(block: Callable): void {
	for (let i = 0; i < 2; i++) {
		block();
	}
}

describe("DataSet", function () {
	describe("iterator", function () {
		it("works for 1 loop", function () {
			const ds = new DataSet(low);
			twice(() => {
				const generated: number[] = [];
				for (const n of ds) {
					generated.push(n);
				}
				expect(generated).deep.equals(low);
			});
		});
		it("works for nested loops", function () {
			const ds = new DataSet(short);
			const generated: number[] = [];
			for (const i of ds) {
				generated.push(i);
				for (const j of ds) {
					generated.push(j);
				}
			}
			expect(generated).deep.equals([ 1, 1, 2, 3, 2, 1, 2, 3, 3, 1, 2, 3 ]);
		});
	});

	describe("mean", function () {
		it("works", function () {
			expect(new DataSet(low).mean, "low mean").equals(5);
			expect(new DataSet(mid).mean, "mid mean").equals(6);
			expect(new DataSet(high).mean, "high mean").equals(50);
			expect(new DataSet(neg).mean, "negLow mean").equals(-5);
			expect(new DataSet(straddle).mean, "negLow mean").equals(0);
			expect(isNaN(new DataSet([]).mean)).is.true;
		});
	});

	describe("sampleStandardDeviation", function () {
		it("works", function () {
			const ds = new DataSet(low);
			twice(() => expect(ds.sampleStandardDeviation).closeTo(lowSampleStdDev, 0.00000001));
		});
	});

	describe("sampleVariance", function () {
		it("works", function () {
			const ds = new DataSet(low);
			twice(() => expect(ds.sampleVariance).equals(lowSampleVariance));
		});
		it("throws for too-small", function () {
			expect(() => new DataSet([]).sampleVariance).throws("Sample variance requires at least 2 data points.");
			expect(() => new DataSet([1]).sampleVariance).throws("Sample variance requires at least 2 data points.");
		});
	});

	describe("sum", function () {
		it("works", function () {
			expect(new DataSet(low).sum, "low mean").equals(45);
			expect(new DataSet(mid).sum, "mid mean").equals(54);
			expect(new DataSet(high).sum, "high mean").equals(450);
			expect(new DataSet(neg).sum, "negLow mean").equals(-45);
			expect(new DataSet(straddle).sum, "negLow mean").equals(0);
			expect(new DataSet([]).sum, "negLow mean").equals(0);
		});
	});

	describe("sumSquareDeviations", function () {
		it("works", function () {
			const ds = new DataSet(low);
			twice(() => expect(ds.sumSquareDeviations).equals(lowSumSquareDeviations));
		});
	});

	describe("compareWith", function () {
		it("works for really obvious differences", function () {
			const lowSet = new DataSet(low);
			const highSet = new DataSet(high);
			const midSet = new DataSet(mid);
			expect(lowSet.tTestTwo(highSet)).lessThan(-1);
			expect(highSet.compareWith(lowSet)).equals(DataSetCompareResult.OTHER_IS_SMALLER);
			expect(lowSet.compareWith(highSet)).equals(DataSetCompareResult.OTHER_IS_LARGER);
			expect(lowSet.compareWith(midSet)).equals(DataSetCompareResult.INDETERMINATE);
			expect(lowSet.compareWith(lowSet.map(n => n + 1))).equals(DataSetCompareResult.INDETERMINATE);
			expect(lowSet.compareWith(lowSet.map(n => n + 2))).equals(DataSetCompareResult.INDETERMINATE);
			expect(lowSet.compareWith(lowSet.map(n => n + 2.5))).equals(DataSetCompareResult.INDETERMINATE);
			expect(lowSet.compareWith(lowSet.map(n => n + 2.5), 0.1)).equals(DataSetCompareResult.OTHER_IS_LARGER);
			expect(lowSet.compareWith(lowSet.map(n => n + 3))).equals(DataSetCompareResult.OTHER_IS_LARGER);
			expect(lowSet.compareWith(lowSet.map(n => n + 3), 0.02)).equals(DataSetCompareResult.INDETERMINATE);
		});
	});
});
