import { expect } from "chai";
import { describe, it } from "mocha";
import { formatPercent } from "./formatPercent";

describe("formatPercent", function () {
	it("handles 0.15", function () {
		expect(formatPercent(0.15)).equals("15%");
	});
	it("handles 0.15 @0", function () {
		expect(formatPercent(0.15, 0)).equals("15%");
	});
	it("handles 0.15 @-1", function () {
		expect(formatPercent(0.15, -1)).equals("20%");
	});
	it("handles 0.12 @-1", function () {
		expect(formatPercent(0.12, -1)).equals("10%");
	});
	it("handles 0.15 @1", function () {
		expect(formatPercent(0.15, 1)).equals("15%");
	});
	it("handles 0.123 @1", function () {
		expect(formatPercent(0.123, 1)).equals("12.3%");
	});
	it("handles 0.123 @2", function () {
		expect(formatPercent(0.123, 2)).equals("12.3%");
	});
	it("handles 0.123 @0", function () {
		expect(formatPercent(0.123, 0)).equals("12%");
	});
});
