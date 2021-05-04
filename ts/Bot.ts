import { Action } from "./Action";
import {
	AssistOutcome,
	isAssistOutcome,
	isTypeAssistAction,
	isValueAssistAction,
	TypeAssistAction,
	ValueAssistAction,
} from "./AssistAction";
import { BOT_STRATEGIES } from "./BotStrategies";
import { BotTurnStrategy } from "./BotTurn";
import { BasicBotTurnEvaluator, BotTurnEvaluator } from "./BotTurnEvaluator";
import { ConfirmOutcome, isConfirmOutcome } from "./ConfirmAction";
import { EffectWeightOpsFromType } from "./defaultScores";
import { EliminateOutcome, isEliminateOutcome } from "./EliminateAction";
import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import {
	BadInvestigateOutcome,
	DeadLeadInvestigateOutcome,
	GoodInvestigateOutcome,
	isBadInvestigateOutcome,
	isDeadLeadInvestigateOutcome,
	isGoodInvestigateOutcome,
} from "./InvestigateAction";
import { formatLeadCard } from "./LeadCard";
import { LEAD_TYPES } from "./LeadType";
import { Logger, SILENT_LOGGER } from "./logger";
import { formatMysteryCard, HasMysteryHand, MysteryCard, MysteryPile } from "./MysteryCard";
import { OtherHand } from "./OtherHand";
import { Outcome } from "./Outcome";
import { ActivePlayer, isSamePlayer } from "./Player";
import { isPursueOutcome, PursueOutcome } from "./PursueAction";
import { range } from "./range";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { TurnStart } from "./TurnStart";
import { unconfirmedLeads } from "./unconfirmedLeads";

export const BOT_NAMES: string[] = [
	"Alice",
	"Bryce",
	"Chuck",
	"Daisy",
	"Edgar",
	"Fiona",
];

const nextName = (function nextName() {
	let index: number | undefined;
	return function nextName(prng: PseudoRNG): string {
		if (index === undefined) {
			index = Math.floor(prng() * BOT_NAMES.length);
		}
		index = (index + 1) % BOT_NAMES.length;
		return BOT_NAMES[index];
	};
})();

export class Bot implements ActivePlayer, HasMysteryHand {
	public readonly hand: MysteryCard[] = [];
	public readonly remainingEvidence = new MysteryPile();

	constructor(
		private readonly logger: Logger = SILENT_LOGGER,
		private readonly prng: PseudoRNG = DEFAULT_PRNG,
		scoreFromTypeOverrides: Partial<EffectWeightOpsFromType> = {},
		public readonly name: string = nextName(prng),
		private readonly strategies: BotTurnStrategy[] = BOT_STRATEGIES.slice(),
		private readonly evaluator: BotTurnEvaluator = new BasicBotTurnEvaluator(scoreFromTypeOverrides, logger),
	) {}

	public addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean): void {
		const mysteryCard = evidenceCard != null ? MysteryCard.fromEvidenceCard(evidenceCard) : fromRemainingEvidence ? this.remainingEvidence.toMysteryCard() : new MysteryCard();
		this.hand.splice(index, 0, mysteryCard);
		this.logger.trace(() => `${this.name} took a card.  ${this.formatKnowledge(undefined)}`);
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

	private formatHandIndexes(handIndexes: number[]): string {
		return "«" + this.hand.map((c, i) => handIndexes.includes(i) ? "✓" : "␣").join("") + "»";
	}

	public formatKnowledge(turn: TurnStart | undefined): string {
		const unconfirmedCount = turn == null ? 3 : unconfirmedLeads(turn).length;
		return `${this.name} knows ${this.hand.map(card => this.formatKnowledgeForCard(card, unconfirmedCount, turn)).join(", ")}.`;
	}

	private formatKnowledgeForCard(card: MysteryCard, unconfirmedCount: number, turn: TurnStart | undefined): string {
		let tail = "";
		if (turn != null) {
			const couldMatchLeads = LEAD_TYPES.map(leadType => turn.board.leads[leadType])
				.filter(lead => card.couldBeType(lead.leadCard.evidenceType));
			if (couldMatchLeads.length === 0) {
				tail += " (impossible)";
			} else if (couldMatchLeads.length === unconfirmedCount) {
				tail += " (anywhere)";
			} else {
				tail += ` (maybe for: ${couldMatchLeads.map(lead => formatLeadCard(lead.leadCard)).join(" or ")})`;
			}
		}
		return `${formatMysteryCard(card)}${tail}`;
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
		if (isSamePlayer(this, outcome.action.player)) {
			this.wasAssisted(outcome);
		}
	}

	private sawBadInvestigate(outcome: BadInvestigateOutcome): void {
		this.sawEvidence(outcome.evidenceCard);
	}

	private sawConfirm(outcome: ConfirmOutcome): void {
		// nothing to do here?  The next lines just make the linter happy.
		// noinspection BadExpressionStatementJS
		outcome;
		// noinspection BadExpressionStatementJS
		this;
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
		const option = this.evaluator.selectOption(options, this, turnStart);
		if (option == null) {
			throw new Error(`No option found from ${options.length} options`);
		}
		return option.action;
	}

	// noinspection JSUnusedGlobalSymbols
	public toJSON(): Record<string, unknown> {
		return {
			hand: this.hand,
			name: this.name,
			remainingEvidence: this.remainingEvidence,
		};
	}

	private wasAssisted(outcome: AssistOutcome): void {
		const action = outcome.action;
		const handIndexes = outcome.identifiedHandIndexes;
		let sawWhat: EvidenceType | EvidenceValue;
		if (isTypeAssistAction(action)) {
			this.wasTypeAssisted(action, handIndexes);
			sawWhat = action.evidenceType;
		} else if (isValueAssistAction(action)) {
			this.wasValueAssisted(action, handIndexes);
			sawWhat = action.evidenceValue;
		} else {
			throw new Error(`Unknown Assist type: ${action}`);
		}
		this.logger.trace(() => `${this.name} saw ${sawWhat} at ${this.formatHandIndexes(handIndexes)}. ${this.formatKnowledge(undefined)}`);
	}

	private wasTypeAssisted(action: TypeAssistAction, handIndexes: number[]): void {
		this.wasTypeOrValueAssisted(action.evidenceType, handIndexes, (c, t) => c.setType(t), (c, t) => c.eliminateType(t));
	}

	private wasTypeOrValueAssisted<TV extends EvidenceType | EvidenceValue>(
		tv: TV,
		handIndexes: number[],
		setter: (card: MysteryCard, tv: TV) => void,
		eliminator: (card: MysteryCard, tv: TV) => void,
	) {
		for (let i = 0; i < this.hand.length; i++) {
			const mysteryCard = this.hand[i];
			if (handIndexes.includes(i)) {
				setter(mysteryCard, tv);
			} else {
				eliminator(mysteryCard, tv);
			}
			const evidenceCard = mysteryCard.asEvidence();
			if (evidenceCard != null) {
				this.sawEvidence(evidenceCard);
			}
		}
	}

	private wasValueAssisted(action: ValueAssistAction, handIndexes: number[]): void {
		this.wasTypeOrValueAssisted(action.evidenceValue, handIndexes, (c, v) => c.setValue(v), (c, v) => c.eliminateValue(v));
	}
}
