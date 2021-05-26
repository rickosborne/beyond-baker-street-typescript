import { expect } from "chai";
import { describe, it } from "mocha";
import { isDefined } from "./defined";

describe("isDefined", function () {
	it("detects null", function () {
		expect(isDefined(null)).equals(false);
	});
	it("detects undefined", function () {
		expect(isDefined(undefined)).equals(false);
	});
	it("does not detect zero", function () {
		expect(isDefined(0)).equals(true);
	});
	it("does not detect false", function () {
		expect(isDefined(false)).equals(true);
	});
});
