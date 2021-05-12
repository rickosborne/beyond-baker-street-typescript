import { expect } from "chai";
import { describe, it } from "mocha";
import { Predicate } from "./Predicate";
import { removeIf } from "./removeIf";

function test(predicate: Predicate<number>, after: number[]): void {
	const before = [ 2, 3, 4, 5 ];
	const count = removeIf(before, predicate);
	expect(count).equals(4 - after.length);
	expect(before).deep.equals(after);
}

describe("removeIf", function () {
	it("removes only first", function () {
		test(n => n === 2, [ 3, 4, 5 ]);
	});
	it("removes mid", function () {
		test(n => n === 3, [ 2, 4, 5 ]);
	});
	it("removes last", function () {
		test(n => n === 5, [ 2, 3, 4 ]);
	});
	it("removes none", function () {
		test(n => n === 1, [ 2, 3, 4, 5 ]);
	});
	it("removes multiple", function () {
		test(n => n % 2 === 0, [ 3, 5 ]);
	});
});
