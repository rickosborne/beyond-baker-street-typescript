import { expect } from "chai";
import { describe, it } from "mocha";
import { AdlerInspectorStrategy, AdlerOption, isAdlerOption } from "./Adler";
import { HOLMES_MAX, HOLMES_MOVE_PROGRESS } from "../Game";
import { TurnStart } from "../TurnStart";
import { VisibleBoard } from "../VisibleBoard";

function mockTurn(holmesLocation: number): TurnStart {
	return <TurnStart> {
		board: <VisibleBoard> {
			holmesLocation,
		},
	};
}

function buildAndFind(holmesLocation: number, usedAlready: boolean): AdlerOption[] {
	const turn = mockTurn(holmesLocation);
	const adler = new AdlerInspectorStrategy();
	if (usedAlready) {
		adler.sawAdlerOutcome();
	}
	const options = adler.buildOptions(turn);
	return options.filter(isAdlerOption);
}

const HOLMES_NOT_MAX = HOLMES_MAX + HOLMES_MOVE_PROGRESS;

describe("AdlerInspectorStrategy", function () {
	it("adds the option if not already used and holmes is not at max", function () {
		expect(buildAndFind(HOLMES_NOT_MAX, false)).is.length(1);
	});

	it("does not add the option if Holmes is at max", function () {
		expect(buildAndFind(HOLMES_MAX, false)).is.empty;
	});

	it("does not add the option if Holmes is not at max but it's already been used", function () {
		expect(buildAndFind(HOLMES_NOT_MAX, true)).is.empty;
	});
});
