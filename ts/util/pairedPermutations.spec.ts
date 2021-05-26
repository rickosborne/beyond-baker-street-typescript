import { expect } from "chai";
import { describe, it } from "mocha";
import { pairedPermutations, pairedPermutations2 } from "./pairedPermutations";

describe("pairedPermutations", function () {
	it("does what it says", function () {
		expect(pairedPermutations([ 1, "a", true ])).has.deep.members([
			[ 1, "a" ],
			[ 1, true ],
			[ "a", true ],
		]);
	});
});

describe("pairedPermutations2", function () {
	it("does what it says", function () {
		expect(pairedPermutations2([ 1, "a" ], [ true, { d: 4 } ])).has.deep.members([
			[ 1, true ],
			[ 1, { d: 4 } ],
			[ "a", true ],
			[ "a", { d: 4 } ],
		]);
	});
});
