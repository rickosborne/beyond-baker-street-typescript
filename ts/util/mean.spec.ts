import { expect } from "chai";
import { describe, it } from "mocha";
import { mean } from "./mean";

describe("mean", function () {
	it("works for empty arrays", function () {
		expect(mean([])).equals(0);
	});
	it("works for single-element arrays", function () {
		expect(mean([5])).equals(5);
	});
	it("works for multi-element arrays", function () {
		expect(mean([ 1, 2, 3, 4, 5 ])).equals(3);
	});
});
