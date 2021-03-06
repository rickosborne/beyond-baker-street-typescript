import { Action } from "../Action";
import { ActionType } from "../ActionType";
import { addEffectsEvenIfDuplicate } from "../addEffect";
import { Bot } from "../Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "../BotTurn";
import { EVIDENCE_CARD_VALUE_MAX, EvidenceCard, formatEvidence } from "../EvidenceCard";
import { EVIDENCE_TYPES, EvidenceType } from "../EvidenceType";
import { Supplier } from "../Function";
import { INVESTIGATION_MARKER_GOAL } from "../Game";
import { OncePerGameInspectorStrategy } from "../InspectorStrategy";
import { InspectorType } from "../InspectorType";
import { formatUnknownCard, MysteryCard, UnknownCard } from "../MysteryCard";
import { Outcome, OutcomeType } from "../Outcome";
import { OtherPlayer, Player, PlayerInspector } from "../Player";
import { TurnStart } from "../TurnStart";
import { unfinishedLeads } from "../unfinishedLeads";

export interface PikeAction extends Action {
	actionType: ActionType.Pike;
	activeHandIndexBefore: number;
	givenUnknownCard: UnknownCard;
	otherEvidence: EvidenceCard;
	otherHandIndexBefore: number;
	otherPlayer: Player;
}

export interface PikeOption extends BotTurnOption {
	action: PikeAction;
	strategyType: BotTurnStrategyType.Inspector;
}

export interface PikeOutcome extends Outcome {
	action: PikeAction;
	activeHandIndexAfter: number;
	activePlayer: PlayerInspector<InspectorType.Pike>;
	givenEvidence: EvidenceCard;
	otherHandIndexAfter: number;
	outcomeType: OutcomeType.Pike;
}

export function isPikeAction(maybe: unknown): maybe is PikeAction {
	return (maybe != null) && ((maybe as PikeAction).actionType === ActionType.Pike);
}

export function isPikeOutcome(maybe: unknown): maybe is PikeOutcome {
	return (maybe != null) && ((maybe as PikeOutcome).outcomeType === OutcomeType.Pike);
}

export function formatPikeAction(action: PikeAction, player: Player, givenEvidence?: EvidenceCard): string {
	return `${player.name} swapped ${givenEvidence == null ? formatUnknownCard(action.givenUnknownCard) : formatEvidence(givenEvidence)} with ${formatEvidence(action.otherEvidence)} from ${action.otherPlayer.name}.`;
}

export function formatPikeOutcome(outcome: PikeOutcome): string {
	return formatPikeAction(outcome.action, outcome.activePlayer, outcome.givenEvidence);
}

/**
 * Give Gregson a card which would complete the investigation.
 */
export function buildPikeGregsonOptions(
	turn: TurnStart,
	gregson: OtherPlayer,
	hand: MysteryCard[],
	doubleGap: number,
): PikeOption[] {
	const otherHand = turn.askOtherPlayerAboutTheirHand(gregson).hand;
	const options: PikeOption[] = [];
	for (let activeHandIndexBefore = 0; activeHandIndexBefore < hand.length; activeHandIndexBefore++) {
		const givenMysteryCard = hand[activeHandIndexBefore];
		const possibleValues = givenMysteryCard.possibleValues;
		if (possibleValues.length === 1) {
			const evidenceValue = possibleValues[0];
			if (evidenceValue === doubleGap) {
				for (let otherHandIndexBefore = 0; otherHandIndexBefore < otherHand.length; otherHandIndexBefore++) {
					const otherUnknownCard = otherHand[otherHandIndexBefore];
					const otherEvidence = gregson.hand[otherHandIndexBefore];
					if (otherEvidence.evidenceValue !== evidenceValue) {
						options.push(buildPikeOption(activeHandIndexBefore, givenMysteryCard, otherEvidence, otherHandIndexBefore, otherUnknownCard, gregson, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateMaybeUsefulSetsUpExact));
					}
				}
			}
		}
	}
	return options;
}

export function buildPikeOption(
	activeHandIndexBefore: number,
	givenUnknownCard: UnknownCard,
	otherEvidence: EvidenceCard,
	otherHandIndexBefore: number,
	otherUnknownCard: UnknownCard,
	otherPlayer: Player,
	...effects: BotTurnEffectType[]
): PikeOption {
	if (otherUnknownCard.possibleCount > 1) {
		addEffectsEvenIfDuplicate(effects, BotTurnEffectType.AssistKnown);
	}
	if (givenUnknownCard.possibleCount > 1) {
		addEffectsEvenIfDuplicate(effects, BotTurnEffectType.AssistKnown);
	}
	return {
		action: {
			actionType: ActionType.Pike,
			activeHandIndexBefore,
			givenUnknownCard,
			otherEvidence,
			otherHandIndexBefore,
			otherPlayer,
		},
		effects,
		strategyType: BotTurnStrategyType.Inspector,
	};
}

// * Give Lestrade a card which would otherwise break the investigation.
export function buildPikeLestradeOptions(
	turn: TurnStart,
	lestrade: OtherPlayer,
	hand: MysteryCard[],
	investigationGap: number,
	unusedEvidenceTypes: EvidenceType[],
): PikeOption[] {
	const options: PikeOption[] = [];
	const otherHand = turn.askOtherPlayerAboutTheirHand(lestrade).hand;
	for (let activeHandIndexBefore = 0; activeHandIndexBefore < hand.length; activeHandIndexBefore++) {
		const givenMysteryCard = hand[activeHandIndexBefore];
		const possibleValues = givenMysteryCard.possibleValues;
		const possibleTypes = givenMysteryCard.possibleTypes;
		const couldBreak = possibleValues.findIndex(v => v > investigationGap) >= 0;
		const maybeUnused = possibleTypes.findIndex(t => unusedEvidenceTypes.includes(t)) >= 0;
		if (couldBreak && maybeUnused) {
			for (let otherHandIndexBefore = 0; otherHandIndexBefore < otherHand.length; otherHandIndexBefore++) {
				const otherUnknownCard = otherHand[otherHandIndexBefore];
				const otherEvidence = lestrade.hand[otherHandIndexBefore];
				if ((otherEvidence.evidenceValue > investigationGap) && unusedEvidenceTypes.includes(otherEvidence.evidenceType)) {
					// do nothing
				} else {
					options.push(buildPikeOption(activeHandIndexBefore, givenMysteryCard, otherEvidence, otherHandIndexBefore, otherUnknownCard, lestrade, BotTurnEffectType.EliminatePossibility, BotTurnEffectType.EliminateMaybeUseful));
				}
			}
		}
	}
	return options;
}

export function buildPikeOtherOptions(
	turn: TurnStart,
	otherPlayers: OtherPlayer[],
	hand: MysteryCard[]
): PikeOption[] {
	let mostPossible = 3;  // because we don't want to swap a known for a known
	const optionAdders: Supplier<PikeOption>[] = [];
	for (const otherPlayer of otherPlayers) {
		const otherHand = turn.askOtherPlayerAboutTheirHand(otherPlayer).hand;
		for (let activeHandIndexBefore = 0; activeHandIndexBefore < hand.length; activeHandIndexBefore++) {
			const givenMysteryCard = hand[activeHandIndexBefore];
			for (let otherHandIndexBefore = 0; otherHandIndexBefore < otherHand.length; otherHandIndexBefore++) {
				const otherEvidence = otherPlayer.hand[otherHandIndexBefore];
				const otherUnknownCard = otherHand[otherHandIndexBefore];
				const possibleCount = givenMysteryCard.possibleCount + otherUnknownCard.possibleCount;
				if (possibleCount > mostPossible) {
					optionAdders.splice(0, optionAdders.length);
					mostPossible = possibleCount;
				}
				if (possibleCount === mostPossible) {
					optionAdders.push(() => buildPikeOption(activeHandIndexBefore, givenMysteryCard.asUnknown(), otherEvidence, otherHandIndexBefore, otherUnknownCard, otherPlayer));
				}
			}
		}
	}
	return optionAdders.map(adder => adder());
}

export function buildPikeOptions(turn: TurnStart, hand: MysteryCard[]): PikeOption[] {
	const options: PikeOption[] = [];
	// Reasons Pike might want to swap cards:
	// * Give Gregson a card which would complete the investigation.
	// * Give Lestrade a card which would otherwise break the investigation.
	// * Get rid of a card about which Pike has little knowledge
	// * Take a card about which the other person has little knowledge
	const gregson = turn.otherPlayers.find(op => op.inspector === InspectorType.Gregson);
	const investigationGap = INVESTIGATION_MARKER_GOAL - turn.board.investigationMarker;
	const doubleGap = investigationGap * 2;
	const usedEvidenceTypes = unfinishedLeads(turn).map(lead => lead.leadCard.evidenceType);
	const unusedEvidenceTypes = EVIDENCE_TYPES.filter(t => !usedEvidenceTypes.includes(t));
	if ((gregson != null) && (doubleGap > 0) && (doubleGap <= EVIDENCE_CARD_VALUE_MAX)) {
		options.push(...buildPikeGregsonOptions(turn, gregson, hand, doubleGap));
	}
	const lestrade = turn.otherPlayers.find(op => op.inspector === InspectorType.Lestrade);
	if ((lestrade != null) && (investigationGap <= EVIDENCE_CARD_VALUE_MAX)) {
		options.push(...buildPikeLestradeOptions(turn, lestrade, hand, investigationGap, unusedEvidenceTypes));
	}
	const otherPlayers = turn.otherPlayers.filter(op => op.inspector !== InspectorType.Gregson && op.inspector !== InspectorType.Lestrade);
	options.push(...buildPikeOtherOptions(turn, otherPlayers, hand));
	return options;
}

export class PikeInspectorStrategy extends OncePerGameInspectorStrategy {
	public readonly inspectorType = InspectorType.Pike;

	public buildOptions(turn: TurnStart, bot: Bot): PikeOption[] {
		return this.whenAvailable(() => buildPikeOptions(turn, bot.hand), []);
	}

	public sawPikeOutcome(): void {
		this.setUsed();
	}
}
