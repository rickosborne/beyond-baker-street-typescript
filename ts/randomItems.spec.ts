import { describe, it } from "mocha";
import { expect } from "chai";
import { randomItems } from "./randomItems";
import { PseudoRNG } from "./rng";

type TestablePRNG = PseudoRNG & {
	calledCount(): number;
}

function orderedPRNG(...items: number[]): TestablePRNG {
	let calledCount = 0;
	function prng(): number {
		return items[calledCount++];
	}
	return Object.assign(prng, {
		calledCount(): number {
			return calledCount;
		},
	});
}

const FOOD_ITEMS = [ "apple", "banana", "cherry", "durian", "eggplant", "fig", "honeycomb" ];

describe("randomItems", function () {
	it("follows the RNG", function () {
		const rng = orderedPRNG(4/7, 2/6, 3/5, 0);
		expect(randomItems(FOOD_ITEMS, 3, rng))
			.deep.equals([ "eggplant", "cherry", "fig" ]);
		expect(rng.calledCount()).equals(3);
	});

	it("finds what it can", function () {
		const rng = orderedPRNG(1/2, 1/3, 1/4, 0);
		expect(randomItems(FOOD_ITEMS.slice(0, 2), 3, rng)).deep.equals([ "banana", "apple" ]);
		expect(rng.calledCount()).equals(2);
	});
});
