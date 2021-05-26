import { expect } from "chai";
import { describe, it } from "mocha";
import { stddev } from "./stddev";

describe("stddev", function () {
	it("works for empty arrays", function () {
		expect(stddev([])).equals(0);
	});
	it("works for single-element arrays", function () {
		expect(stddev([5])).equals(0);
	});
	it("works for multi-element arrays", function () {
		expect(stddev([ 1, 2, 3, 4, 5 ])).equals(Math.sqrt(2));
	});
});
