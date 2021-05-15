import { describe, it } from "mocha";
import { expect } from "chai";
import { mean, stddev, sum } from "./arrayMath";

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
