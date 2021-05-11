import { expect } from "chai";
import { describe, it } from "mocha";
import { addEffectsEvenIfDuplicate, addEffectsIfNotPresent } from "./addEffect";
import { BotTurnEffectType } from "./BotTurn";

describe("addEffectsIfNotPresent", function () {
	it("adds when not present", function () {
		const effects: BotTurnEffectType[] = [BotTurnEffectType.Win];
		addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
		expect(effects)
			.is.length(2)
			.and.includes.members([ BotTurnEffectType.Win, BotTurnEffectType.Lose ]);
	});

	it("doesn't add when already present", function () {
		const effects: BotTurnEffectType[] = [BotTurnEffectType.Win];
		addEffectsIfNotPresent(effects, BotTurnEffectType.Win);
		expect(effects)
			.is.length(1)
			.and.includes.members([BotTurnEffectType.Win]);
	});
});

describe("addEffectsEvenIfDuplicate", function () {
	it("adds when not present", function () {
		const effects: BotTurnEffectType[] = [BotTurnEffectType.Win];
		addEffectsEvenIfDuplicate(effects, BotTurnEffectType.Lose);
		expect(effects)
			.is.length(2)
			.and.includes.members([ BotTurnEffectType.Win, BotTurnEffectType.Lose ]);
	});

	it("adds again when already present", function () {
		const effects: BotTurnEffectType[] = [BotTurnEffectType.Win];
		addEffectsEvenIfDuplicate(effects, BotTurnEffectType.Win);
		expect(effects)
			.is.length(2)
			.and.deep.equals([ BotTurnEffectType.Win, BotTurnEffectType.Win ]);
	});
});
