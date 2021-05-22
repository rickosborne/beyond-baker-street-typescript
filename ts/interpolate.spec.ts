import { expect } from "chai";
import { describe, it } from "mocha";
import { interpolate } from "./interpolate";

describe("interpolate", function () {
	it("works left-to-right", function () {
		expect(interpolate(0, 5, 2, 12, 3)).equals(8);
		expect(interpolate(0, 5, 12, 2, 3)).equals(6);
	});
	it("works right-to-left", function () {
		expect(interpolate(5, 0, 2, 12, 3)).equals(6);
		expect(interpolate(5, 0, 12, 2, 3)).equals(8);
	});
});
