import { describe, it } from "mocha";
import { expect } from "chai";
import { EvidenceValue } from "./EvidenceValue";
import { range } from "./range";
import { allPathsTo, summingPathsTo } from "./summingPathsTo";

describe("summingPathsTo", function () {
	const setups: [ number, number[] ][] = [
		[ 1, [ 1, 1 ] ],
		[ 2, [ 0, 1, 1 ] ],
		[ 3, [ 0, 1, 2, 2 ] ],
		[ 4, [ 0, 0, 1, 2, 2 ] ],
		[ 5, [ 0, 0, 1, 2, 3, 3 ] ],
		[ 6, [ 0, 0, 1, 2, 3, 4 ] ],
		[ 7, [ 0, 0, 0, 2, 3, 4 ] ],
		[ 8, [ 0, 0, 0, 1, 3, 4 ] ],
		[ 9, [ 0, 0, 0, 1, 3, 5 ] ],
		[ 10, [ 0, 0, 0, 1, 3, 5 ] ],
		[ 11, [ 0, 0, 0, 0, 2, 5 ] ],
		[ 12, [ 0, 0, 0, 0, 2, 5 ] ],
		[ 13, [ 0, 0, 0, 0, 1, 4 ] ],
		[ 14, [ 0, 0, 0, 0, 1, 4 ] ],
		[ 15, [ 0, 0, 0, 0, 1, 4 ] ],
		[ 16, [ 0, 0, 0, 0, 0, 3 ] ],
		[ 17, [ 0, 0, 0, 0, 0, 2 ] ],
		[ 18, [ 0, 0, 0, 0, 0, 2 ] ],
		[ 19, [ 0, 0, 0, 0, 0, 1 ] ],
		[ 20, [ 0, 0, 0, 0, 0, 1 ] ],
		[ 21, [ 0, 0, 0, 0, 0, 1 ] ],
	];
	for (const setup of setups) {
		const [ target, expected ] = setup;
		for (let i = 0; i < expected.length; i++) {
			const values = range(1, i + 1);
			const paths = expected[i];
			it(`finds ${paths} for ${target} from [${values.join(",")}]`, function () {
				expect(summingPathsTo(target, values)).equals(paths);
			});
		}
	}
});


describe("allPathsTo", function () {
	const setups: EvidenceValue[][][] = [
		[],
		[[1]],
		[[2]],
		[ [ 1, 2 ], [3] ],
		[ [ 1, 3 ], [4] ],
		[ [ 1, 4 ], [ 2, 3 ], [5] ],
		[ [ 1, 2, 3 ], [ 1, 5 ], [ 2, 4 ], [6] ],
		[ [ 1, 2, 4 ], [ 1, 6 ], [ 2, 5 ], [ 3, 4 ] ],
		[ [ 1, 2, 5 ], [ 1, 3, 4 ], [ 2, 6 ], [ 3, 5 ] ],
		[ [ 1, 2, 6 ], [ 1, 3, 5 ], [ 2, 3, 4 ], [ 3, 6 ], [ 4, 5 ] ],
	];
	for (let i = 0; i < setups.length; i++) {
		const setup = setups[i];
		it(`calculates ${i}`, function () {
			expect(JSON.stringify(allPathsTo(i))).equals(JSON.stringify(setup));
		});
	}
});
