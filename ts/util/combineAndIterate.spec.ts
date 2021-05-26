import { expect } from "chai";
import { describe, it } from "mocha";
import { collect } from "./collect";
import { combineAndIterate } from "./combineAndIterate";

describe("combineAndIterate", function () {
	it("works", function () {
		expect(collect(combineAndIterate(
			1,
			(a, b) => (a * 10) + b,
			[
				n => [ n * 2, n * 3, n * 4 ][Symbol.iterator](),
				n => [ n * 5, n * 6 ][Symbol.iterator](),
			],
		))).deep.equals([
			(2 * 10) + (5 * 2),
			(2 * 10) + (6 * 2),
			(3 * 10) + (5 * 3),
			(3 * 10) + (6 * 3),
			(4 * 10) + (5 * 4),
			(4 * 10) + (6 * 4),
		]);
	});
	it("works for single iterators", function () {
		expect(collect(combineAndIterate(
			1,
			(a, b) => (a * 10) + b,
			[
				n => [ n * 2, n * 3, n * 4 ][Symbol.iterator](),
			],
		))).deep.equals([ 2, 3, 4 ]);
	});
	it("works for empty iterators", function () {
		expect(collect(combineAndIterate(
			1,
			(a, b) => (a * 10) + b,
			[],
		))).deep.equals([]);
	});
});
