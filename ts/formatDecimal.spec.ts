import { expect } from "chai";
import { describe, it } from "mocha";
import { formatDecimal } from "./formatDecimal";

describe("formatDecimal", function () {
	it("handles undefined", function () {
		expect(formatDecimal(undefined)).equals("");
	});
	it("handles 12.34 @-1", function () {
		expect(formatDecimal(12.34, -1)).equals("10");
	});
	it("handles 15 @-1", function () {
		expect(formatDecimal(15, -1)).equals("20");
	});
	it("handles 12.34 @0", function () {
		expect(formatDecimal(12.34, 0)).equals("12");
	});
	it("handles 12.34 @1", function () {
		expect(formatDecimal(12.34, 1)).equals("12.3");
	});
	it("handles 12.34 @1 with zero-fill", function () {
		expect(formatDecimal(12.34, 1)).equals("12.3");
	});
	it("handles 12.34 @2", function () {
		expect(formatDecimal(12.34, 2)).equals("12.34");
	});
	it("handles 12.345 @2 (rounding)", function () {
		expect(formatDecimal(12.345, 2)).equals("12.35");
	});
	it("handles 12.34 @3", function () {
		expect(formatDecimal(12.34, 3)).equals("12.34");
	});
	it("handles 12.34 @3 with zero-fill", function () {
		expect(formatDecimal(12.34, 3, true)).equals("12.340");
	});
	it("handles 12.34 @4 with zero-fill", function () {
		expect(formatDecimal(12.34, 4, true)).equals("12.3400");
	});
	it("handles 12 @0", function () {
		expect(formatDecimal(12, 0)).equals("12");
	});
	it("handles 12 @0 with zero-fill", function () {
		expect(formatDecimal(12, 0)).equals("12");
	});
	it("handles 12 @1", function () {
		expect(formatDecimal(12, 1)).equals("12");
	});
	it("handles 12 @1 with zero-fill", function () {
		expect(formatDecimal(12, 1, true)).equals("12.0");
	});
	it("handles 12 @2 with zero-fill", function () {
		expect(formatDecimal(12, 2, true)).equals("12.00");
	});
	it("handles 12 @3 with zero-fill", function () {
		expect(formatDecimal(12, 3, true)).equals("12.000");
	});
});
