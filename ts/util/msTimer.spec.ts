import { describe, it } from "mocha";
import { expect } from "chai";
import { msTimer } from "./timer";

describe("msTimer", function() {
	it("works", function () {
		const t = msTimer();
		expect(t).is.a("function");
		const a = t();
		expect(a).is.greaterThanOrEqual(0);
		const b = t();
		expect(b).equals(a);
	});
});
