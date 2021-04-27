import { ActivePlayer, isSamePlayer } from "./Player";
import { Outcome } from "./Outcome";
import { TurnStart } from "./TurnStart";
import { Action } from "./Action";
import { MysteryCard, MysteryPile } from "./MysteryCard";
import { range } from "./range";
import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { AssistOutcome, isAssistOutcome, isTypeAssistAction, isValueAssistAction } from "./AssistAction";
import {
	BadInvestigateOutcome,
	DeadLeadInvestigateOutcome,
	GoodInvestigateOutcome,
	isBadInvestigateOutcome,
	isDeadLeadInvestigateOutcome,
	isGoodInvestigateOutcome,
} from "./InvestigateAction";
import { ConfirmOutcome, isConfirmOutcome } from "./ConfirmAction";
import { EliminateOutcome, isEliminateOutcome } from "./EliminateAction";
import { isPursueOutcome, PursueOutcome } from "./PursueAction";
import { LEAD_TYPES } from "./LeadType";
import { OtherHand } from "./OtherHand";
import { BotTurnStrategy } from "./BotTurn";
import { BOT_STRATEGIES } from "./BotStrategies";
import { BotTurnEvaluator, DEFAULT_BOT_TURN_EVALUATOR } from "./BotTurnEvaluator";

export const BOT_NAMES: string[] = [
	"Alice",
	"Bryce",
	"Chuck",
	"Daisy",
	"Edgar",
	"Fiona",
];

const nextName = (function nextName() {
	let index = Math.floor(Math.random() * BOT_NAMES.length);
	return function nextName(): string {
		index = (index + 1) % BOT_NAMES.length;
		return BOT_NAMES[index];
	};
})();

export class Bot implements ActivePlayer {
	public readonly hand: MysteryCard[] = [];
	public readonly remainingEvidence = new MysteryPile();

	constructor(
		public readonly name: string = nextName(),
		private readonly strategies: BotTurnStrategy[] = BOT_STRATEGIES.slice(),
		private readonly evaluator: BotTurnEvaluator = DEFAULT_BOT_TURN_EVALUATOR,
	) {}

	public addCard(index: number, evidenceCard: EvidenceCard | undefined): void {
		const mysteryCard = evidenceCard == null ? new MysteryCard() : new MysteryCard([evidenceCard.evidenceType], [evidenceCard.evidenceValue]);
		this.hand.splice(index, 0, mysteryCard);
	}

	private assessGameState(turnStart: TurnStart): void {
		for (const otherPlayer of turnStart.otherPlayers) {
			this.sawEvidences(otherPlayer.hand);
		}
		const board = turnStart.board;
		const leads = board.leads;
		for (const leadType of LEAD_TYPES) {
			const lead = leads[leadType];
			this.sawEvidences(lead.badCards);
			this.sawEvidences(lead.evidenceCards);
		}
		const impossible = board.impossibleCards;
		this.sawEvidences(impossible.filter(c => isEvidenceCard(c)) as EvidenceCard[]);
	}

	public get otherHand(): OtherHand {
		return {
			hand: this.hand.slice(),
		};
	}

	public removeCardAt(index: number): void {
		this.hand.splice(index, 1);
	}

	private returnEvidence(evidenceCard: EvidenceCard): void {
		this.sawEvidence(evidenceCard);
		this.remainingEvidence.addToBottom(evidenceCard);
	}

	private sawAssist(outcome: AssistOutcome): void {
		const action = outcome.action;
		if (isSamePlayer(this, action.player)) {
			let updater: (identified: boolean, card: MysteryCard) => void;
			if (isTypeAssistAction(action)) {
				updater = (identified: boolean, card: MysteryCard) => identified ? card.setType(action.evidenceType) : card.eliminateType(action.evidenceType);
			} else if (isValueAssistAction(action)) {
				updater = (identified: boolean, card: MysteryCard) => identified ? card.setValue(action.evidenceValue) : card.eliminateValue(action.evidenceValue);
			} else {
				throw new Error(`Unknown Assist type: ${action}`);
			}
			for (let i = 0; i < this.hand.length; i++) {
				const mysteryCard = this.hand[i];
				updater(outcome.identifiedHandIndexes.includes(i), mysteryCard);
				const evidenceCard = mysteryCard.asEvidence();
				if (evidenceCard != null) {
					this.sawEvidence(evidenceCard);
				}
			}
		}
	}

	private sawBadInvestigate(outcome: BadInvestigateOutcome): void {
		this.sawEvidence(outcome.evidenceCard);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private sawConfirm(outcome: ConfirmOutcome): void {
		// nothing to do here?
	}

	private sawDeadLead(outcome: DeadLeadInvestigateOutcome): void {
		this.returnEvidence(outcome.evidenceCard);
		for (const evidenceCard of outcome.returnedEvidence) {
			this.returnEvidence(evidenceCard);
		}
	}

	private sawEliminate(outcome: EliminateOutcome): void {
		this.sawEvidence(outcome.evidenceCard);
	}

	private sawEvidence(evidenceCard: EvidenceCard): void {
		this.remainingEvidence.eliminate(evidenceCard);
		for (const mysteryCard of this.hand) {
			mysteryCard.eliminateCard(evidenceCard);
		}
	}

	private sawEvidences(evidenceCards: EvidenceCard[]): void {
		for (const evidenceCard of evidenceCards) {
			this.sawEvidence(evidenceCard);
		}
	}

	private sawGoodInvestigate(outcome: GoodInvestigateOutcome): void {
		this.sawEvidence(outcome.evidenceCard);
	}

	public sawOutcome(outcome: Outcome): void {
		if (isAssistOutcome(outcome)) {
			this.sawAssist(outcome);
		} else if (isBadInvestigateOutcome(outcome)) {
			this.sawBadInvestigate(outcome);
		} else if (isConfirmOutcome(outcome)) {
			this.sawConfirm(outcome);
		} else if (isDeadLeadInvestigateOutcome(outcome)) {
			this.sawDeadLead(outcome);
		} else if (isEliminateOutcome(outcome)) {
			this.sawEliminate(outcome);
		} else if (isGoodInvestigateOutcome(outcome)) {
			this.sawGoodInvestigate(outcome);
		} else if (isPursueOutcome(outcome)) {
			this.sawPursue(outcome);
		} else {
			throw new Error(`Unknown outcome: ${outcome}`);
		}
	}

	private sawPursue(outcome: PursueOutcome): void {
		for (const evidenceCard of outcome.returnedEvidence) {
			this.returnEvidence(evidenceCard);
		}
	}

	public setHandCount(handCount: number): void {
		this.hand.splice(0, this.hand.length, ...range(1, handCount).map(() => new MysteryCard()));
	}

	public takeTurn(turnStart: TurnStart): Action {
		this.assessGameState(turnStart);
		const options = this.strategies.flatMap(s => s.buildOptions(turnStart, this));
		const option = this.evaluator.selectOption(options, turnStart);
		if (option == null) {
			throw new Error(`No option found from ${options.length} options`);
		}
		return option.action;
	}
}
