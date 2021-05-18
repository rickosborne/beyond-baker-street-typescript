import { Action } from "./Action";
import { AdlerInspectorStrategy, isAdlerOutcome } from "./Adler";
import {
	AssistOutcome,
	isAssistOutcome,
	isTypeAssistAction,
	isValueAssistAction,
	TypeAssistAction,
	ValueAssistAction,
} from "./AssistAction";
import { BaskervilleInspectorStrategy, isBaskervilleOutcome } from "./Baskerville";
import { BlackwellChoice, BlackwellTurn } from "./Blackwell";
import { BOT_STRATEGIES } from "./BotStrategies";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy } from "./BotTurn";
import { BasicBotTurnEvaluator, BotTurnEvaluator } from "./BotTurnEvaluator";
import { isConfirmOutcome } from "./ConfirmAction";
import { Consumer } from "./Consumer";
import { EffectWeightOpsFromType } from "./defaultScores";
import { isDefined } from "./defined";
import { EliminateOutcome, isEliminateOutcome } from "./EliminateAction";
import { buildEliminateEffects, EliminateStrategy } from "./EliminateStrategy";
import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { MonoFunction } from "./Function";
import { Guard } from "./Guard";
import { HopeOutcome, isHopeOutcome } from "./Hope";
import { HudsonOutcome, isHudsonOutcome } from "./Hudson";
import { InspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import {
	BadInvestigateOutcome,
	DeadLeadInvestigateOutcome,
	GoodInvestigateOutcome,
	isBadInvestigateOutcome,
	isDeadLeadInvestigateOutcome,
	isGoodInvestigateOutcome,
} from "./InvestigateAction";
import { buildEffectsForLeadWithCard, InvestigateStrategy } from "./InvestigateStrategy";
import { formatLeadCard } from "./LeadCard";
import { LEAD_TYPES } from "./LeadType";
import { Logger, SILENT_LOGGER } from "./logger";
import { formatMysteryCard, HasMysteryHand, MysteryCard } from "./MysteryCard";
import { MysteryPile } from "./MysteryPile";
import { OtherHand } from "./OtherHand";
import { Outcome, OutcomeType, TypedOutcome } from "./Outcome";
import { isPikeOutcome, PikeInspectorStrategy, PikeOutcome } from "./Pike";
import { availableValuesByType } from "./playedEvidence";
import { ActivePlayer, isSamePlayer, Player } from "./Player";
import { isPursueOutcome, PursueOutcome } from "./PursueAction";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { strategyForInspector } from "./StrategyForInspector";
import { BottomOrTop, isTobyOutcome, TobyInspectorStrategy } from "./Toby";
import { TurnStart } from "./TurnStart";
import { unconfirmedLeads } from "./unconfirmedLeads";
import { unfinishedLeads } from "./unfinishedLeads";

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

function buildOutcomeHandler<T extends OutcomeType, O extends TypedOutcome<T>>(guard: Guard<O>, consumer: Consumer<O>): MonoFunction<Outcome, boolean> {
	return outcome => {
		if (guard(outcome)) {
			consumer(outcome);
			return true;
		}
		return false;
	};
}

export class Bot implements ActivePlayer, HasMysteryHand {
	private readonly eliminateStrategy: EliminateStrategy;
	public readonly hand: MysteryCard[] = [];
	private readonly inspectorStrategy: InspectorStrategy | undefined;
	private readonly investigateStrategy: InvestigateStrategy;
		private readonly outcomeHandlers: Record<OutcomeType, MonoFunction<Outcome, boolean>> = {
		[OutcomeType.Adler]: buildOutcomeHandler(isAdlerOutcome, () => this.sawAdler()),
		[OutcomeType.Assist]: buildOutcomeHandler(isAssistOutcome, o => this.sawAssist(o)),
		[OutcomeType.BadInvestigate]: buildOutcomeHandler(isBadInvestigateOutcome, o => this.sawBadInvestigate(o)),
		[OutcomeType.Baskerville]: buildOutcomeHandler(isBaskervilleOutcome, () => this.sawBaskerville()),
		[OutcomeType.Confirm]: buildOutcomeHandler(isConfirmOutcome, () => void(0)),
		[OutcomeType.DeadLead]: buildOutcomeHandler(isDeadLeadInvestigateOutcome, o => this.sawDeadLead(o)),
		[OutcomeType.Eliminate]: buildOutcomeHandler(isEliminateOutcome, o => this.sawEliminate(o)),
		[OutcomeType.GoodInvestigate]: buildOutcomeHandler(isGoodInvestigateOutcome, o => this.sawGoodInvestigate(o)),
		[OutcomeType.Hope]: buildOutcomeHandler(isHopeOutcome, o => this.sawHope(o)),
		[OutcomeType.Hudson]: buildOutcomeHandler(isHudsonOutcome, o => this.sawHudson(o)),
		[OutcomeType.Pike]: buildOutcomeHandler(isPikeOutcome, o => this.sawPike(o)),
		[OutcomeType.Pursue]: buildOutcomeHandler(isPursueOutcome, o => this.sawPursue(o)),
		[OutcomeType.Toby]: buildOutcomeHandler(isTobyOutcome, () => void(0)),
	};
	public readonly remainingEvidence = new MysteryPile();

	constructor(
		private readonly logger: Logger = SILENT_LOGGER,
		private readonly prng: PseudoRNG = DEFAULT_PRNG,
		scoreFromTypeOverrides: Partial<EffectWeightOpsFromType> = {},
		public readonly inspector: InspectorType | undefined,
		public readonly name: string = inspector == null ? nextName(prng) : inspector,
		private readonly strategies: BotTurnStrategy[] = BOT_STRATEGIES.slice(),
		private readonly evaluator: BotTurnEvaluator = new BasicBotTurnEvaluator(scoreFromTypeOverrides, logger),
	) {
		this.inspectorStrategy = inspector == null ? undefined : strategyForInspector(inspector, logger);
		this.investigateStrategy = strategies.find(s => s instanceof InvestigateStrategy) as InvestigateStrategy;
		this.eliminateStrategy = strategies.find(s => s instanceof EliminateStrategy) as EliminateStrategy;
	}

	public addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean): void {
		const mysteryCard = evidenceCard != null ? MysteryCard.fromEvidenceCard(evidenceCard) : fromRemainingEvidence ? this.remainingEvidence.toMysteryCard() : new MysteryCard();
		this.hand.splice(index, 0, mysteryCard);
		if (this.inspectorStrategy instanceof TobyInspectorStrategy) {
			this.inspectorStrategy.addCard(index, evidenceCard, fromRemainingEvidence, mysteryCard);
		}
		this.logger.trace(() => `${this.name} took a card.  ${this.formatKnowledge(undefined)}`);
	}

	private assessGameState(turnStart: TurnStart): number {
		let eliminatedFromHands = 0;
		for (const otherPlayer of turnStart.otherPlayers) {
			eliminatedFromHands += this.sawEvidences(otherPlayer.hand);
		}
		const board = turnStart.board;
		const leads = board.leads;
		let eliminatedFromLeads = 0;
		for (const leadType of LEAD_TYPES) {
			const lead = leads[leadType];
			eliminatedFromLeads += this.sawEvidences(lead.badCards);
			eliminatedFromLeads += this.sawEvidences(lead.evidenceCards);
		}
		const impossible = board.impossibleCards;
		const eliminatedFromImpossible = this.sawEvidences(impossible.filter(c => isEvidenceCard(c)) as EvidenceCard[]);
		console.log(`Eliminated ${eliminatedFromHands} from hands, ${eliminatedFromLeads} from leads, ${eliminatedFromImpossible} impossible.`);
		return eliminatedFromHands + eliminatedFromLeads + eliminatedFromImpossible;
	}

	public chooseForBlackwell(blackwellTurn: BlackwellTurn): BlackwellChoice {
		const votes: [ number, number ] = [ 0, 0 ];
		const leads = unfinishedLeads(blackwellTurn);
		const otherCards = [
			blackwellTurn.blackwell.hand,
			blackwellTurn.otherPlayers.flatMap(op => op.hand),
		].flatMap(ecs => ecs);
		const availableByType = availableValuesByType(blackwellTurn);
		for (let i = 0; i < blackwellTurn.evidences.length; i++) {
			const evidenceCard = blackwellTurn.evidences[i];
			const mysteryCard = MysteryCard.fromEvidenceCard(evidenceCard);
			const { evidenceType } = evidenceCard;
			const effects: BotTurnEffectType[] = [];
			for (const lead of leads.filter(l => l.leadCard.evidenceType === evidenceType)) {
				const investigateEffects = buildEffectsForLeadWithCard(lead, mysteryCard, availableByType[evidenceType]);
				effects.push(...investigateEffects);
			}
			const eliminateEffects = buildEliminateEffects(mysteryCard, leads.map(l => l.leadCard.evidenceType), otherCards, blackwellTurn, undefined, false);
			effects.push(...eliminateEffects);
			votes[i] = this.evaluator.scoreEffects(effects, blackwellTurn);
		}
		const keepIndex = votes[0] > votes[1] ? 0 : 1;
		const buryIndex = 1 - keepIndex;
		return {
			bury: blackwellTurn.evidences[buryIndex],
			keep: blackwellTurn.evidences[keepIndex],
		};
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
		this.remainingEvidence.add(evidenceCard);
	}

	private sawAdler(): void {
		if (this.inspectorStrategy instanceof AdlerInspectorStrategy) {
			this.inspectorStrategy.sawAdlerOutcome();
		}
	}

	private sawAssist(outcome: AssistOutcome): void {
		if (isSamePlayer(this, outcome.action.player)) {
			this.wasAssisted(outcome);
		}
	}

	private sawBadInvestigate(outcome: BadInvestigateOutcome): void {
		this.sawEvidence(outcome.evidenceCard);
	}

	private sawBaskerville(): void {
		if (this.inspectorStrategy instanceof BaskervilleInspectorStrategy) {
			this.inspectorStrategy.sawBaskervilleOutcome();
		}
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

	/**
	 * @returns {number} The number of cards actually eliminated.
	 */
	private sawEvidence(evidenceCard: EvidenceCard): number {
		let eliminated = this.remainingEvidence.eliminate(evidenceCard);
		for (const mysteryCard of this.hand) {
			eliminated += mysteryCard.eliminateCard(evidenceCard);
		}
		return eliminated;
	}

	public sawEvidenceDealt(player: Player, evidenceCard: EvidenceCard | undefined): void {
		if (!isSamePlayer(player, this) && (this.inspectorStrategy instanceof TobyInspectorStrategy)) {
			this.inspectorStrategy.sawEvidenceDealt();
		}
		if (isDefined(evidenceCard)) {
			this.sawEvidence(evidenceCard);
		}
	}

	public sawEvidenceReturned(evidenceCards: EvidenceCard[], bottomOrTop: BottomOrTop, shuffle: true): void {
		evidenceCards.forEach(evidenceCard => this.remainingEvidence.add(evidenceCard));
		if (this.inspectorStrategy instanceof TobyInspectorStrategy) {
			this.inspectorStrategy.sawEvidenceReturned(evidenceCards, bottomOrTop, shuffle);
		}
	}

	/**
	 * @returns {number} The number of cards actually eliminated.
	 */
	private sawEvidences(evidenceCards: EvidenceCard[]): number {
		let eliminated = 0;
		for (const evidenceCard of evidenceCards) {
			eliminated += this.sawEvidence(evidenceCard);
		}
		return eliminated;
	}

	private sawGoodInvestigate(outcome: GoodInvestigateOutcome): void {
		this.sawEvidence(outcome.evidenceCard);
	}

	private sawHope(outcome: HopeOutcome): void {
		for (const assistOutcome of outcome.assistOutcomes) {
			this.sawAssist(assistOutcome);
		}
	}

	private sawHudson(outcome: HudsonOutcome): void {
		this.remainingEvidence.add(outcome.action.impossibleEvidence);
	}

	public sawOutcome(outcome: Outcome): void {
		const handlers = this.outcomeHandlers;
		const wasHandled = (Object.keys(handlers) as OutcomeType[]).findIndex(h => handlers[h](outcome)) >= 0;
		if (!wasHandled) {
			throw new Error(`Unknown outcome: ${outcome}`);
		}
	}

	private sawPike(outcome: PikeOutcome): void {
		if (isSamePlayer(outcome.activePlayer, this)) {
			if (this.inspectorStrategy instanceof PikeInspectorStrategy) {
				this.inspectorStrategy.sawPikeOutcome();
			} else {
				throw new Error(`Pike active player does not have PikeInspectorStrategy, which should be impossible.`);
			}
			// assumption: this happens _after_ the cards have been swapped
			const mysteryCard = this.hand[outcome.activeHandIndexAfter];
			mysteryCard.setExact(outcome.action.otherEvidence);
		} else if (isSamePlayer(outcome.action.otherPlayer, this)) {
			// assumption: this happens _after_ the cards have been swapped
			const mysteryCard = this.hand[outcome.otherHandIndexAfter];
			mysteryCard.setExact(outcome.givenEvidence);
		}
	}

	private sawPursue(outcome: PursueOutcome): void {
		for (const evidenceCard of outcome.returnedEvidence) {
			this.returnEvidence(evidenceCard);
		}
	}

	public takeTurn(turnStart: TurnStart): Action {
		// this.assessGameState(turnStart);  // No longer needed?
		const options = this.strategies.flatMap(s => s.buildOptions(turnStart, this));
		const removedOptions: BotTurnOption[] = [];
		if (this.inspectorStrategy != null) {
			options.push(...this.inspectorStrategy.buildOptions(turnStart, this));
			this.inspectorStrategy.processOptions(options, removedOptions);
		}
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
