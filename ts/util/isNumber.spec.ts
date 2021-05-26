import { expect } from "chai";
import { describe, it } from "mocha";
import { isNumber } from "./isNumber";

describe("isNumber", function () {
	it("recognizes numbers", function () {
		expect(isNumber(123)).is.true;
	});
	it("does not recognize Infinity", function () {
		expect(isNumber(5 / 0)).is.false;
	});
	it("does not recognize NaN", function () {
		expect(isNumber(NaN)).is.false;
	});
});
