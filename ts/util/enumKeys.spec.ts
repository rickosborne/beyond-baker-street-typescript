import { expect } from "chai";
import { describe, it } from "mocha";
import { enumKeys } from "./enumKeys";

enum EnumKeysTestNoValue {
	Alpha,
	Bravo
}

enum EnumKeysTestValue {
	Charlie = "Charlie",
	Delta = "Delta",
}

describe("enumKeys", function () {
	it("works when the enum has explicit values", function () {
		expect(enumKeys(EnumKeysTestValue)).deep.equals([ "Charlie", "Delta" ]);
	});
	it("works when the enum has implicit values", function () {
		expect(enumKeys(EnumKeysTestNoValue)).deep.equals([ "Alpha", "Bravo" ]);
	});
});
