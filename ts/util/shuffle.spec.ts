import { expect } from "chai";
import { describe, it } from "mocha";
import { PseudoRNG } from "../rng";
import { range } from "./range";
import { shuffleCopy } from "./shuffle";

function fakeRng(nums: number[]): PseudoRNG {
	let index = 0;
	return () => nums[index++];
}

describe("shuffleCopy", function () {
	it("works", function () {
		const original = range(1, 3);
		const shuffled = shuffleCopy(original, fakeRng([ 0.7, 0.3, 0.5 ]));
		expect(shuffled).deep.equals([ 2, 1, 3 ]);
		expect(original).deep.equals([ 1, 2, 3 ]);
	});
});

