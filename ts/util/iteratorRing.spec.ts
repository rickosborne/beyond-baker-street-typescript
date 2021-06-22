import { expect } from "chai";
import { describe, it } from "mocha";
import { collect } from "./collect";
import { iteratorRing } from "./iteratorRing";

function basic() {
	return iteratorRing(
		[ 5, 6 ][Symbol.iterator](),
		[4][Symbol.iterator](),
		[ 1, 2, 3 ][Symbol.iterator](),
	);
}

describe("iteratorRing", function () {
	it("next", function () {
		expect(collect(basic())).deep.equals([ 5, 4, 1, 6, 2, 3 ]);
	});

	it("return", function () {
		const ring = basic();
		expect(ring.next()).includes({ value: 5 });
		if (ring.return === undefined) {
			expect(ring.return, "ring.return should be defined").is.not.undefined;
		} else {
			expect(ring.return(9)).deep.equals({ done: true, value: 9 });
		}
		expect(ring.next()).includes({ done: true, value: undefined });
	});

	it("throw", function () {
		const ring = basic();
		expect(ring.next()).includes({ value: 5 });
		expect(() => {
			if (ring.throw === undefined) {
				expect(ring.throw, "ring.return should be defined").is.not.undefined;
			} else {
				ring.throw(new Error("something test"));
			}
		}).throws("something test");
		expect(ring.next()).includes({ done: true, value: undefined });
	});

	it("iterable", function () {
		const ring = basic();
		const iterator = ring[Symbol.iterator]();
		expect(collect(iterator)).deep.equals([ 5, 4, 1, 6, 2, 3 ]);
	});
});
