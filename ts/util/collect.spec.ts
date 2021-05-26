import { expect } from "chai";
import { describe, it } from "mocha";
import { collect } from "./collect";

describe("collect", function () {
	it("does what it says", function () {
		expect(collect([ 1, 3, 5 ][Symbol.iterator]())).deep.equals([ 1, 3, 5 ]);
	});
	it("checks for null", function () {
		expect(() => collect(undefined as unknown as Iterator<unknown>)).throws("iterator or iterable");
	});
});
