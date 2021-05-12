import { expect } from "chai";
import { describe, it } from "mocha";
import { zeroFill } from "./zeroFill";

describe("zeroFill", function () {
	it("does what it says", function () {
		expect(zeroFill(12.3, 3)).equals("012");
		expect(zeroFill(12, 3)).equals("012");
		expect(zeroFill(12, 2)).equals("12");
		expect(zeroFill(12, 1)).equals("12");
	});
});
