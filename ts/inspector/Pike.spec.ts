import { expect } from "chai";
import { describe, it } from "mocha";
import { ActionType } from "../ActionType";
import { BotTurnEffectType } from "../BotTurn";
import { evidence, EvidenceCard } from "../EvidenceCard";
import { EvidenceType } from "../EvidenceType";
import { EvidenceValue } from "../EvidenceValue";
import { InspectorType } from "../InspectorType";
import { MysteryCard, UnknownCard } from "../MysteryCard";
import { OtherHand } from "../OtherHand";
import {
	buildPikeGregsonOptions,
	buildPikeLestradeOptions,
	buildPikeOption,
	buildPikeOtherOptions,
	PikeInspectorStrategy,
} from "./Pike";
import { OtherPlayer } from "../Player";
import { TurnStart } from "../TurnStart";

function buildStrategy(used = false): PikeInspectorStrategy {
	const strategy = new PikeInspectorStrategy();
	if (used) {
		strategy.sawPikeOutcome();
	}
	return strategy;
}

function otherPlayer(
	hand: EvidenceCard[],
	inspector?: InspectorType | undefined,
): OtherPlayer {
	return <OtherPlayer>{
		hand,
		inspector,
		name: "other",
	};
}

function unknownCard(possibleTypes: EvidenceType[], possibleValues: EvidenceValue[]): UnknownCard {
	const possibleCount = possibleTypes.length * possibleValues.length;
	return {
		possibleCount,
		possibleTypes,
		possibleValues,
	};
}

function turn(
	unknownCards: UnknownCard[],
): TurnStart {
	return <TurnStart>{
		askOtherPlayerAboutTheirHand: (op: OtherPlayer): OtherHand => ({ hand: unknownCards }),
	};
}

describe("PikeInspectorStrategy", function () {
	// describe("buildPikeOption", function () {
	// 	it("", function () {
	//
	// 	});
	// });
	// describe("buildPikeOptions", function () {
	// 	it("", function () {
	//
	// 	});
	// });
	describe("buildPikeGregsonOptions", function () {
		it("works", function () {
			const mysteryCard = new MysteryCard([EvidenceType.Clue], [4]);
			const otherEvidence = evidence(6, EvidenceType.Clue);
			const unk = unknownCard([EvidenceType.Clue], [6]);
			const gregson = otherPlayer([otherEvidence]);
			expect(buildPikeGregsonOptions(turn([unk]), gregson, [mysteryCard], 4))
				.deep.equals([buildPikeOption(0, mysteryCard, otherEvidence, 0, unk, gregson, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateMaybeUsefulSetsUpExact)]);
		});
	});
	describe("buildPikeLestradeOptions", function () {
		it("works", function () {
			const mysteryCard = new MysteryCard([EvidenceType.Clue], [5]);
			const otherEvidence = evidence(1, EvidenceType.Clue);
			const unk = unknownCard([EvidenceType.Clue], [1]);
			const lestrade = otherPlayer([otherEvidence]);
			expect(buildPikeLestradeOptions(turn([unk]), lestrade, [mysteryCard], 4, [EvidenceType.Clue]))
				.deep.equals([buildPikeOption(0, mysteryCard, otherEvidence, 0, unk, lestrade, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateMaybeUseful)]);
		});
	});
	describe("buildPikeOtherOptions", function () {
		it("works", function () {
			const clueEvidence = evidence(6, EvidenceType.Clue);
			const witnessEvidence = evidence(6, EvidenceType.Witness);
			const op = otherPlayer([ clueEvidence, witnessEvidence ]);
			const options = buildPikeOtherOptions(turn([
				unknownCard([EvidenceType.Clue], [6]),
				unknownCard([ EvidenceType.Witness, EvidenceType.Document ], [6]),
			]), [op], [
				new MysteryCard([EvidenceType.Track], [1]),
			]);
			expect(options).lengthOf(1);
			expect(options[0]).deep.includes({
				action: {
					actionType: ActionType.Pike,
					activeHandIndexBefore: 0,
					givenUnknownCard: {
						possibleCount: 1,
						"possibleTypes": [EvidenceType.Track],
						"possibleValues": [1],
					},
					"otherEvidence": witnessEvidence,
					"otherHandIndexBefore": 1,
					"otherPlayer": op,
				},
				"effects": [BotTurnEffectType.AssistKnown],
				"strategyType": "Inspector",
			});
		});
	});
	// describe("buildOptions", function () {
	// 	it("", function () {
	//
	// 	});
	// });
});
