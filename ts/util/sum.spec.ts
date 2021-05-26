import { expect } from "chai";
import { describe, it } from "mocha";
import { sum } from "./sum";

describe("sum", function () {
	it("works for empty arrays", function () {
		expect(sum([])).equals(0);
	});
	it("works for single-element arrays", function () {
		expect(sum([5])).equals(5);
	});
	it("works for multi-element arrays", function () {
		expect(sum([ 1, 2, 3, 4, 5 ])).equals(15);
	});
});
