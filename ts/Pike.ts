import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { addEffectsEvenIfDuplicate } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { EVIDENCE_CARD_VALUE_MAX, EvidenceCard, formatEvidence } from "./EvidenceCard";
import { EVIDENCE_TYPES, EvidenceType } from "./EvidenceType";
import { Callable } from "./Function";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { OncePerGameInspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { formatMysteryCard, MysteryCard, UnknownCard } from "./MysteryCard";
import { Outcome, OutcomeType } from "./Outcome";
import { OtherPlayer, Player, PlayerInspector } from "./Player";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";

export interface PikeAction extends Action {
	actionType: ActionType.Pike;
	activeHandIndexBefore: number;
	givenMysteryCard: MysteryCard;
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
	return `${player.name} swapped ${givenEvidence == null ? formatMysteryCard(action.givenMysteryCard) : formatEvidence(givenEvidence)} with ${formatEvidence(action.otherEvidence)} from ${action.otherPlayer.name}.`;
}

export function formatPikeOutcome(outcome: PikeOutcome): string {
	return formatPikeAction(outcome.action, outcome.activePlayer, outcome.givenEvidence);
}

export class PikeInspectorStrategy extends OncePerGameInspectorStrategy {
	public readonly inspectorType = InspectorType.Pike;

	private addGregsonOptions(
		options: PikeOption[],
		turn: TurnStart,
		gregson: OtherPlayer,
		hand: MysteryCard[],
		doubleGap: number
	): void {
		const otherHand = turn.askOtherPlayerAboutTheirHand(gregson).hand;
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
							this.addOption(options, activeHandIndexBefore, givenMysteryCard, otherEvidence, otherHandIndexBefore, otherUnknownCard, gregson, BotTurnEffectType.EliminateSetsUpExact);
						}
					}
				}
			}
		}
	}

	private addLestradeOptions(
		options: PikeOption[],
		turn: TurnStart,
		lestrade: OtherPlayer,
		hand: MysteryCard[],
		investigationGap: number,
		unusedEvidenceTypes: EvidenceType[],
	): void {
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
						this.addOption(options, activeHandIndexBefore, givenMysteryCard, otherEvidence, otherHandIndexBefore, otherUnknownCard, lestrade, BotTurnEffectType.EliminateUnknownValueUnusedType);
					}
				}
			}
		}
	}

	// noinspection JSMethodCanBeStatic
	private addOption(
		options: PikeOption[],
		activeHandIndexBefore: number,
		givenMysteryCard: MysteryCard,
		otherEvidence: EvidenceCard,
		otherHandIndexBefore: number,
		otherUnknownCard: UnknownCard,
		otherPlayer: Player,
		...effects: BotTurnEffectType[]
	): void {
		if (otherUnknownCard.possibleCount > 1) {
			addEffectsEvenIfDuplicate(effects, BotTurnEffectType.AssistKnown);
		}
		if (givenMysteryCard.possibleCount > 1) {
			addEffectsEvenIfDuplicate(effects, BotTurnEffectType.AssistKnown);
		}
		options.push({
			action: {
				actionType: ActionType.Pike,
				activeHandIndexBefore,
				givenMysteryCard,
				otherEvidence,
				otherHandIndexBefore,
				otherPlayer,
			},
			effects,
			strategyType: BotTurnStrategyType.Inspector,
		});
	}

	private addOtherOptions(
		options: PikeOption[],
		turn: TurnStart,
		otherPlayers: OtherPlayer[],
		hand: MysteryCard[]
	): void {
		let mostPossible = 3;  // because we don't want to swap a known for a known
		const optionAdders: Callable[] = [];
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
						optionAdders.push(() => this.addOption(options, activeHandIndexBefore, givenMysteryCard, otherEvidence, otherHandIndexBefore, otherUnknownCard, otherPlayer));
					}
				}
			}
		}
		optionAdders.forEach(adder => adder());
	}

	public buildOptions(turn: TurnStart, bot: Bot): PikeOption[] {
		const options: PikeOption[] = [];
		this.ifAvailable(() => {
			// Reasons Pike might want to swap cards:
			// * Give Gregson a card which would complete the investigation.
			// * Give Lestrade a card which would otherwise break the investigation.
			// * Get rid of a card about which Pike has little knowledge
			// * Take a card about which the other person has little knowledge
			const gregson = turn.otherPlayers.find(op => op.inspector === InspectorType.Gregson);
			const investigationGap = INVESTIGATION_MARKER_GOAL - turn.board.investigationMarker;
			const doubleGap = investigationGap * 2;
			const hand = bot.hand;
			const usedEvidenceTypes = unfinishedLeads(turn).map(lead => lead.leadCard.evidenceType);
			const unusedEvidenceTypes = EVIDENCE_TYPES.filter(t => !usedEvidenceTypes.includes(t));
			if ((gregson != null) && (doubleGap > 0) && (doubleGap <= EVIDENCE_CARD_VALUE_MAX)) {
				this.addGregsonOptions(options, turn, gregson, hand, doubleGap);
			}
			const lestrade = turn.otherPlayers.find(op => op.inspector === InspectorType.Lestrade);
			if ((lestrade != null) && (investigationGap <= EVIDENCE_CARD_VALUE_MAX)) {
				this.addLestradeOptions(options, turn, lestrade, hand, investigationGap, unusedEvidenceTypes);
			}
			const otherPlayers = turn.otherPlayers.filter(op => op.inspector !== InspectorType.Gregson && op.inspector !== InspectorType.Lestrade);
			this.addOtherOptions(options, turn, otherPlayers, hand);
		});
		return options;
	}

	public sawPikeOutcome(): void {
		this.setUsed();
	}
}
