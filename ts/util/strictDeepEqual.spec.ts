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

	it("handles basic type mismatches", function () {
		expect(strictDeepEqual("1", 1)).is.false;
	});

	it("handles equivalent functions", function () {
		expect(strictDeepEqual(function () {
			return 2;
		}, function () {
			return 2;
		})).is.true;
	});

	it("handles functions", function () {
		expect(strictDeepEqual(function a() {
			return 2;
		}, function b() {
			return 2;
		})).is.false;
	});

	it("handles arrays plus non-arrays", function () {
		expect(strictDeepEqual([1], { a: 1 })).is.false;
		expect(strictDeepEqual({ a: 1 }, [1])).is.false;
	});

	it("handles array length mismatches", function () {
		expect(strictDeepEqual([1], [ 1, 2 ])).is.false;
	});

	it("handles deep nest failures", function () {
		expect(strictDeepEqual({ a: { b: 1 } }, { a: { b: 1 } })).to.be.true;
		expect(strictDeepEqual({ a: { b: 1 } }, { a: { b: 2 } })).to.be.false;
		expect(strictDeepEqual({ a: { b: 1 } }, { a: { c: 1 } })).to.be.false;
	});
});
