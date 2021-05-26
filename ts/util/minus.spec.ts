import { expect } from "chai";
import { describe, it } from "mocha";
import { minus } from "./minus";

describe("minus", function () {
	it("works when item is present", function () {
		expect(minus([ 1, 2, 3 ], 1)).deep.equals([ 2, 3 ]);
		expect(minus([ 1, 2, 3 ], 2)).deep.equals([ 1, 3 ]);
		expect(minus([ 1, 2, 3 ], 3)).deep.equals([ 1, 2 ]);
	});
	it("works when item is not present", function () {
		expect(minus([ 1, 2, 3 ], 4)).deep.equals([ 1, 2, 3 ]);
	});
});
