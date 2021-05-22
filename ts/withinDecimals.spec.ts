import { expect } from "chai";
import { describe, it } from "mocha";
import { withinDecimals } from "./withinDecimals";

describe("withinDecimals", function () {
	([
		[ 10, 11, 0, true ],
		[ 10, 9, 0, true ],
		[ 10, 8, 0, false ],
		[ 10, 9.9, 0, true ],
		[ 10, 9.9, 1, true ],
		[ 10, 9.8, 1, false ],
		[ 10, 9.89, 1, false ],
		[ 10, 9.99, 2, true ],
		[ 10, 9.98, 2, false ],
	] as [number, number, number, boolean][]).forEach(([ a, b, decimals, expectation ]) => {
		it(`is ${expectation} for (${a}, ${b}, ${decimals})`, function () {
			expect(withinDecimals(a, b, decimals)).equals(expectation);
		});
	});
});
