import { expect } from "chai";
import { describe, it } from "mocha";
import { pairedPermutations } from "./pairedPermutations";

describe("pairedPermutations", function () {
	it("does what it says", function () {
		expect(pairedPermutations([ 1, "a", true ])).has.deep.members([
			[ 1, "a" ],
			[ 1, true ],
			[ "a", true ],
		]);
	});
});
