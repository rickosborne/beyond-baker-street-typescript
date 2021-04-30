import { describe, it } from "mocha";
import { expect } from "chai";
import { strictDeepEqual } from "./strictDeepEqual";

describe('strictDeepEqual', function () {

	it('handles out of order keys', function () {
		const a: Record<string, number> = { a: 1, b: 2 };
		const b: Record<string, number> = { b: 2 };
		b.a = 1;
		expect(strictDeepEqual(a, b)).is.true;
		expect(strictDeepEqual(b, a)).is.true;
	});

	it('handles unequal numbers', function () {
		expect(strictDeepEqual(2, 3)).is.false;
		expect(strictDeepEqual(2, NaN)).is.false;
	});

	it('does not sort arrays', function () {
		expect(strictDeepEqual([ 1, 2 ], [ 2, 1 ])).is.false;
	});

	it('handles multi-type arrays', function () {
		expect(strictDeepEqual([ 1, { b: 2 }, true ], [ 1, { b: 2 }, true ])).is.true;
	});
});
