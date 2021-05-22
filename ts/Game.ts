import { Action, TypedAction } from "./Action";
import { ActionType } from "./ActionType";
import { AdlerAction, AdlerOutcome, formatAdlerOutcome, isAdlerAction } from "./Adler";
import {
	AssistAction,
	AssistOutcome,
	formatAssistOutcome,
	isAssistAction,
	isTypeAssistAction,
	isValueAssistAction,
} from "./AssistAction";
import { BaskervilleAction, BaskervilleOutcome, formatBaskervilleOutcome, isBaskervilleAction } from "./Baskerville";
import { BlackwellChoice, BlackwellTurn } from "./Blackwell";
import { BadOrGood, Board } from "./Board";
import { CardType } from "./CardType";
import { CaseFileCard, formatCaseFileCard } from "./CaseFileCard";
import { CheatingActivePlayer, isCheatingActivePlayer } from "./Cheat";
import { ConfirmAction, ConfirmOutcome, formatConfirm, formatConfirmOutcome, isConfirmAction } from "./ConfirmAction";
import { isDefined } from "./defined";
import { EliminateAction, EliminateOutcome, formatEliminateOutcome, isEliminateAction } from "./EliminateAction";
import { EvidenceCard, formatEvidence, isEvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
import { BiFunction } from "./Function";
import { Guard } from "./Guard";
import { formatHopeOutcome, HopeAction, HopeOutcome, isHopeAction } from "./Hope";
import { formatHudsonOutcome, HudsonAction, HudsonOutcome, isHudsonAction } from "./Hudson";
import { InspectorType } from "./InspectorType";
import {
	BadInvestigateOutcome,
	DeadLeadInvestigateOutcome,
	formatBadInvestigateOutcome,
	formatDeadLeadInvestigateOutcome,
	formatGoodInvestigateOutcome,
	GoodInvestigateOutcome,
	InvestigateAction,
	InvestigateOutcome,
	InvestigateOutcomeType,
	isInvestigateAction,
} from "./InvestigateAction";
import { formatLeadCard, isLeadReverseCard } from "./LeadCard";
import { LEAD_TYPES, LeadType } from "./LeadType";
import { Logger, SILENT_LOGGER } from "./logger";
import { OtherHand } from "./OtherHand";
import { Outcome, OutcomeType } from "./Outcome";
import { formatPikeOutcome, isPikeAction, PikeAction, PikeOutcome } from "./Pike";
import { ActivePlayer, formatPlayer, isPlayerInspector, isSamePlayer, OtherPlayer, Player } from "./Player";
import { formatPursueOutcome, isPursueAction, PursueAction, PursueOutcome } from "./PursueAction";
import { range } from "./range";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { BottomOrTop, formatTobyOutcome, isTobyAction, TobyAction, TobyOutcome } from "./Toby";
import { TurnStart } from "./TurnStart";
import { formatLeadsProgress } from "./VisibleBoard";

export const CARDS_PER_PLAYER: Record<number, number> = {
	2: 6,
	3: 4,
	4: 3,
};

export enum GameState {
	Lost = "Lost",
	Playing = "Playing",
	Won = "Won",
}

export enum LossReason {
	HolmesWon = "HolmesWon",
	NotEnoughInvestigation = "NotEnoughInvestigation",
	OutOfLeads = "OutOfLeads",
	TooMuchInvestigation = "TooMuchInvestigation",
}

export class GamePlayer implements OtherPlayer, CheatingActivePlayer {
	public readonly cheats = true;

	constructor(
		public readonly player: ActivePlayer,
		private readonly _hand: EvidenceCard[] = [],
	) {
	}

	public addCard(
		index: number,
		evidenceCard: EvidenceCard | undefined,
		fromRemainingEvidence: boolean,
		playerSawCard = false,
	): void {
		if (evidenceCard == null) {
			throw new Error(`Expected evidence card at ${index}`);
		}
		this._hand.splice(index, 0, evidenceCard);
		const evidence = playerSawCard || isCheatingActivePlayer(this.player) ? evidenceCard : undefined;
		this.player.addCard(index, evidence, fromRemainingEvidence);
	}

	public chooseForBlackwell(blackwellTurn: BlackwellTurn): BlackwellChoice {
		return this.player.chooseForBlackwell(blackwellTurn);
	}

	public get hand(): EvidenceCard[] {
		return this._hand.slice();
	}

	public get inspector(): InspectorType | undefined {
		return this.player.inspector;
	}

	public get name(): string {
		return this.player.name;
	}

	public get otherHand(): OtherHand {
		return this.player.otherHand;
	}

	public removeCardAt(index: number): EvidenceCard {
		const card = this._hand[index];
		this._hand.splice(index, 1);
		this.player.removeCardAt(index);
		return card;
	}

	public sawEvidenceDealt(player: Player, evidenceCard: EvidenceCard, handIndex: number, playerSaw = false): void {
		let evidence: EvidenceCard | undefined = evidenceCard;
		if (isSamePlayer(player, this.player) && !playerSaw && !isCheatingActivePlayer(this.player)) {
			evidence = undefined;
		}
		this.player.sawEvidenceDealt(player, evidence, handIndex);
	}

	public sawEvidenceReturned(evidenceCards: EvidenceCard[], bottomOrTop: BottomOrTop, shuffle: boolean): void {
		this.player.sawEvidenceReturned(evidenceCards, bottomOrTop, shuffle);
	}

	public sawOutcome(outcome: Outcome): void {
		this.player.sawOutcome(outcome);
	}

	public takeTurn(turnStart: TurnStart): Action {
		return this.player.takeTurn(turnStart);
	}

	// noinspection JSUnusedGlobalSymbols  // used by JSON.stringify
	public toJSON(): Record<string, unknown> {
		return {
			hand: this._hand,
			name: this.name,
		};
	}
}

export const HOLMES_GOAL = 0;
export const HOLMES_MAX = 15;
export const INVESTIGATION_MARKER_GOAL = 20;
export const HOLMES_MOVE_PROGRESS = -1;
export const HOLMES_MOVE_IMPEDE = 1;

export interface GameStart {
	playerNames: string[];
	state: GameState.Playing;
}

export interface GameEnd {
	state: GameState;
	turnCount: number;
}

export interface TurnOutcome {
	outcome: Outcome;
	turnNumber: number;
}

function buildActionHandler<T extends ActionType, A extends TypedAction<T>>(
	guard: Guard<A>,
	func: BiFunction<A, GamePlayer, Outcome>
): BiFunction<Action, GamePlayer, Outcome | undefined> {
	return (action: Action, activePlayer: GamePlayer) => {
		if (guard(action)) {
			return func(action, activePlayer);
		}
		return undefined;
	};
}

export enum ReturnEvidenceVisibility {
	All = "All",
	None = "None",
	Toby = "Toby",
}

export class Game {
	private _lossReason: LossReason | undefined;
	private _state: GameState = GameState.Playing;
	private readonly actionHandlers: Record<ActionType, BiFunction<Action, GamePlayer, Outcome | undefined>> = {
		[ActionType.Adler]: buildActionHandler(isAdlerAction, (a, p) => this.applyAdler(a, p)),
		[ActionType.Assist]: buildActionHandler(isAssistAction, (a, p) => this.applyAssist(a, p)),
		[ActionType.Baskerville]: buildActionHandler(isBaskervilleAction, (a, p) => this.applyBaskerville(a, p)),
		[ActionType.Confirm]: buildActionHandler(isConfirmAction, (a, p) => this.applyConfirm(a, p)),
		[ActionType.Eliminate]: buildActionHandler(isEliminateAction, (a, p) => this.applyEliminate(a, p)),
		[ActionType.Hope]: buildActionHandler(isHopeAction, (a, p) => this.applyHope(a, p)),
		[ActionType.Hudson]: buildActionHandler(isHudsonAction, (a, p) => this.applyHudson(a, p)),
		[ActionType.Investigate]: buildActionHandler(isInvestigateAction, (a, p) => this.applyInvestigate(a, p)),
		[ActionType.Pike]: buildActionHandler(isPikeAction, (a, p) => this.applyPike(a, p)),
		[ActionType.Pursue]: buildActionHandler(isPursueAction, (a, p) => this.applyPursue(a, p)),
		[ActionType.Toby]: buildActionHandler(isTobyAction, (a, p) => this.applyToby(a, p)),
	};
	private activePlayerNum = -1;
	private readonly board: Board;
	private readonly cardsPerPlayer: number;
	private readonly players: GamePlayer[];
	private turnCount = 0;

	constructor(
		public readonly caseFile: CaseFileCard,
		players: ActivePlayer[],
		private readonly prng: PseudoRNG = DEFAULT_PRNG,
		private readonly logger: Logger = SILENT_LOGGER,
	) {
		this.board = new Board(caseFile, prng, undefined);
		this.players = players.map(p => new GamePlayer(p));
		this.cardsPerPlayer = CARDS_PER_PLAYER[players.length];
		if (isNaN(this.cardsPerPlayer)) {
			throw new Error(`Invalid number of players: ${players.length}`);
		}
		for (let i = 0; i < this.cardsPerPlayer; i++) {
			for (const player of this.players) {
				const evidence = this.dealEvidence(player);
				if (evidence == null) {
					throw new Error(`Could not deal out all cards`);
				}
			}
		}
		this.players.forEach(player => {
			player.hand.forEach((evidence, handIndex) => {
				this.players.forEach(p => p.sawEvidenceDealt(player, evidence, handIndex, false));
			});
		});
		this.logger.info(() => `Game started with case file ${formatCaseFileCard(caseFile)} and players ${players.map(p => p.name).join(', ')}. Leads are: ${LEAD_TYPES.map(leadType => formatLeadCard(this.board.leads[leadType].leadCard)).join(", ")}.`);
		const gameStart: GameStart = {
			playerNames: this.players.map(p => p.name),
			state: GameState.Playing,
		};
		this.logger.json(gameStart);
		for (const player of this.players) {
			if (player.inspector === InspectorType.Stoner) {
				this.board.raiseImpossibleLimitBy1();
			}
		}
	}

	private applyAction(
		action: Action,
		activePlayer: GamePlayer,
	): void {
		const outcome: Outcome | undefined = (Object.keys(this.actionHandlers) as ActionType[]).reduce((outcome, actionType) => outcome || this.actionHandlers[actionType](action, activePlayer), undefined as Outcome | undefined);
		if (outcome == null) {
			throw new Error(`Unknown action: ${action}`);
		}
		this.broadcastOutcome(outcome);
		this.logger.json(<TurnOutcome>{
			outcome,
			turnNumber: this.turnCount,
		});
		if (this._state !== GameState.Playing) {
			const gameEnd: GameEnd = {
				state: this._state,
				turnCount: this.turnCount,
			};
			this.logger.json(gameEnd);
			this.logger.info(() => this._state === GameState.Lost ? `Lost because ${this._lossReason}.` : this._state);
		} else {
			while (activePlayer.hand.length < this.cardsPerPlayer && this.board.remainingEvidenceCount > 0) {
				this.dealEvidence(activePlayer);
			}
		}
	}

	private applyAdler(action: AdlerAction, activePlayer: GamePlayer): AdlerOutcome {
		if (!isPlayerInspector(activePlayer, InspectorType.Adler)) {
			throw new Error(`You are not Adler: ${formatPlayer(activePlayer)}`);
		}
		const holmesLocation = this.moveHolmes(HOLMES_MOVE_IMPEDE);
		const outcome: AdlerOutcome = {
			action,
			activePlayer,
			holmesLocation,
			outcomeType: OutcomeType.Adler,
		};
		this.logger.info(() => formatAdlerOutcome(outcome));
		return outcome;
	}

	private applyAssist(action: AssistAction, activePlayer: GamePlayer, moveHolmes = true): AssistOutcome {
		if (isSamePlayer(activePlayer, action.player)) {
			throw new Error(`Cannot assist yourself, ${activePlayer.name}`);
		}
		const assistedPlayer = this.findPlayer(action.player);
		let cardMatcher: (card: EvidenceCard) => boolean;
		if (isTypeAssistAction(action)) {
			cardMatcher = (card: EvidenceCard) => card.evidenceType === action.evidenceType;
		} else if (isValueAssistAction(action)) {
			cardMatcher = (card: EvidenceCard) => card.evidenceValue === action.evidenceValue;
		} else {
			throw new Error(`Unknown assist type: ${action}`);
		}
		let holmesLocation = this.board.holmesLocation;
		if (moveHolmes) {
			holmesLocation = this.moveHolmes(HOLMES_MOVE_PROGRESS);
		}
		const outcome: AssistOutcome = {
			action,
			activePlayer,
			holmesLocation,
			identifiedHandIndexes: assistedPlayer.hand
				.map((card, index) => cardMatcher(card) ? index : -1)
				.filter(index => index >= 0),
			outcomeType: OutcomeType.Assist,
		};
		this.logger.info(() => formatAssistOutcome(outcome));
		return outcome;
	}

	private applyBaskerville(action: BaskervilleAction, activePlayer: GamePlayer): BaskervilleOutcome {
		if (!isPlayerInspector(activePlayer, InspectorType.Baskerville)) {
			throw new Error(`You are not Baskerville: ${formatPlayer(activePlayer)}`);
		}
		const impossibleIndex = this.board.impossibleCards.findIndex(c => isEvidenceCard(c) && isSameEvidenceCard(c, action.impossibleEvidence));
		if (impossibleIndex < 0) {
			throw new Error(`Selected evidence is not in the Impossible: ${formatEvidence(action.impossibleEvidence)}`);
		}
		const lead = this.board.leads[action.leadType];
		const leadIndex = lead.evidenceCards.findIndex(c => isSameEvidenceCard(c, action.leadEvidence));
		if (leadIndex < 0) {
			throw new Error(`Selected evidence is not in Lead ${action.leadType}: ${formatEvidence(action.leadEvidence)}`);
		}
		const investigationDelta = this.board.baskervilleSwap(action);
		const investigationMarker = this.board.investigationMarker;
		const outcome: BaskervilleOutcome = {
			action,
			activePlayer,
			investigationDelta,
			investigationMarker,
			outcomeType: OutcomeType.Baskerville,
		};
		this.logger.info(() => formatBaskervilleOutcome(outcome));
		return outcome;
	}

	private applyConfirm(action: ConfirmAction, activePlayer: GamePlayer): ConfirmOutcome {
		if (this.board.isConfirmed(action.leadType)) {
			throw new Error(`Already confirmed: ${formatConfirm(action, activePlayer, this.board.holmesLocation)}`);
		}
		const allowedGaps: number[] = [0];
		if (activePlayer.inspector === InspectorType.Morstan) {
			allowedGaps.push(1);
		}
		const gap = this.board.calculateGapFor(action.leadType);
		if (!allowedGaps.includes(gap)) {
			throw new Error(`Cannot confirm that lead with gap ${gap}: ${formatConfirm(action, activePlayer, this.board.holmesLocation)}`);
		}
		this.board.confirm(action.leadType);
		const holmesLocation = this.moveHolmes(HOLMES_MOVE_IMPEDE);
		this.checkGameCompletion();
		const outcome: ConfirmOutcome = {
			action,
			activePlayer,
			confirmedLeadTypes: LEAD_TYPES.filter(leadType => this.board.isConfirmed(leadType)),
			holmesLocation,
			outcomeType: OutcomeType.Confirm,
			unconfirmedLeadTypes: LEAD_TYPES.filter(leadType => !this.board.isConfirmed(leadType)),
		};
		this.logger.info(() => formatConfirmOutcome(outcome));
		return outcome;
	}

	private applyDeadLead(leadType: LeadType, inspector: InspectorType | undefined): EvidenceCard[] {
		this.board.removeLead(leadType);
		if (inspector !== InspectorType.Wiggins) {
			this.board.addImpossible({ cardType: CardType.LeadReverse });
		}
		const returnedEvidence = this.board.removeEvidenceFor(leadType);
		this.returnEvidence(returnedEvidence, true, BottomOrTop.Bottom, ReturnEvidenceVisibility.All);
		this.checkGameCompletion();
		return returnedEvidence;
	}

	private applyEliminate(action: EliminateAction, activePlayer: GamePlayer): EliminateOutcome {
		const evidenceCard = activePlayer.removeCardAt(action.handIndex);
		if (evidenceCard == null) {
			throw new Error(`Unknown card index for ${activePlayer}: ${action.handIndex}`);
		}
		this.board.addImpossible(evidenceCard, activePlayer.inspector !== InspectorType.Lestrade);
		this.checkGameCompletion();
		const { impossibleCards, investigationMarker } = this.board;
		const impossibleFaceDownCount = impossibleCards.filter(c => isLeadReverseCard(c)).length;
		const outcome: EliminateOutcome = {
			action,
			activePlayer,
			evidenceCard,
			impossibleCards,
			impossibleFaceDownCount,
			investigationMarker,
			outcomeType: OutcomeType.Eliminate,
		};
		this.logger.info(() => formatEliminateOutcome(outcome, this.board));
		return outcome;
	}

	private applyHope(action: HopeAction, activePlayer: GamePlayer): HopeOutcome {
		if (!isPlayerInspector(activePlayer, InspectorType.Hope)) {
			throw new Error(`You're not Hope: ${formatPlayer(activePlayer)}`);
		}
		const assistOutcomes = action.assists.map((assist, index) => this.applyAssist(assist, activePlayer, index === 0));
		const outcome: HopeOutcome = {
			action,
			activePlayer,
			assistOutcomes,
			outcomeType: OutcomeType.Hope,
		};
		this.logger.info(() => formatHopeOutcome(outcome));
		return outcome;
	}

	private applyHudson(action: HudsonAction, activePlayer: GamePlayer): HudsonOutcome {
		if (!isPlayerInspector(activePlayer, InspectorType.Hudson)) {
			throw new Error(`You're not Hudson: ${formatPlayer(activePlayer)}`);
		}
		this.board.removeFromImpossible(action.impossibleEvidence);
		this.returnEvidence([action.impossibleEvidence], true, BottomOrTop.Bottom, ReturnEvidenceVisibility.All);
		const investigationMarker = this.board.investigationMarker;
		const outcome: HudsonOutcome = {
			action,
			activePlayer,
			investigationMarker,
			outcomeType: OutcomeType.Hudson,
		};
		this.logger.info(() => formatHudsonOutcome(outcome));
		return outcome;
	}

	private applyInvestigate(action: InvestigateAction, activePlayer: GamePlayer): InvestigateOutcome {
		const evidenceCard = activePlayer.removeCardAt(action.handIndex);
		if (evidenceCard == null) {
			throw new Error(`Player ${activePlayer} does not have card for action ${action}`);
		}
		const badOrGood = this.board.addEvidence(action.leadType, evidenceCard);
		if (badOrGood === BadOrGood.Bad) {
			const badValue = this.board.calculateBadFor(action.leadType);
			const targetValue = this.board.targetForLead(action.leadType);
			const accumulatedValue = this.board.calculateEvidenceValueFor(action.leadType);
			const outcome: BadInvestigateOutcome = {
				accumulatedValue,
				action,
				activePlayer,
				badValue,
				evidenceCard,
				investigateOutcomeType: InvestigateOutcomeType.Bad,
				outcomeType: OutcomeType.BadInvestigate,
				targetValue,
				totalValue: badValue + targetValue,
			};
			this.logger.info(() => formatBadInvestigateOutcome(outcome));
			return outcome;
		}
		const gap = this.board.calculateGapFor(action.leadType);
		if (gap < 0) {
			const returnedEvidence = this.applyDeadLead(action.leadType, activePlayer.inspector);
			const outcome: DeadLeadInvestigateOutcome = {
				action,
				activePlayer,
				evidenceCard,
				impossibleCount: this.board.impossibleCount,
				investigateOutcomeType: InvestigateOutcomeType.DeadLead,
				nextLead: this.board.leadFor(action.leadType),
				outcomeType: OutcomeType.DeadLead,
				returnedEvidence,
			};
			this.logger.info(() => formatDeadLeadInvestigateOutcome(outcome));
			return outcome;
		}
		const outcome: GoodInvestigateOutcome = {
			accumulatedValue: this.board.calculateEvidenceValueFor(action.leadType),
			action,
			activePlayer,
			badValue: this.board.calculateBadFor(action.leadType),
			evidenceCard,
			investigateOutcomeType: InvestigateOutcomeType.Good,
			outcomeType: OutcomeType.GoodInvestigate,
			targetValue: this.board.targetForLead(action.leadType),
			totalValue: this.board.calculateTotalFor(action.leadType),
		};
		this.logger.info(() => formatGoodInvestigateOutcome(outcome));
		return outcome;
	}

	private applyPike(action: PikeAction, activePlayer: GamePlayer): PikeOutcome {
		if (!isPlayerInspector(activePlayer, InspectorType.Pike)) {
			throw new Error(`You are not Pike: ${formatPlayer(activePlayer)}`);
		}
		const otherPlayer = this.findPlayer(action.otherPlayer);
		const givenEvidence = activePlayer.removeCardAt(action.activeHandIndexBefore);
		const otherEvidence = otherPlayer.removeCardAt(action.otherHandIndexBefore);
		if (!isSameEvidenceCard(action.otherEvidence, otherEvidence)) {
			throw new Error(`Other player card ${formatEvidence(otherEvidence)} at index ${action.otherHandIndexBefore} does not match the given ${action.otherEvidence}`);
		}
		const activeHandIndexAfter = activePlayer.hand.length;
		activePlayer.addCard(activeHandIndexAfter, otherEvidence, false, true);
		const otherHandIndexAfter = otherPlayer.hand.length;
		otherPlayer.addCard(otherHandIndexAfter, givenEvidence, false, true);
		const outcome: PikeOutcome = {
			action,
			activeHandIndexAfter,
			activePlayer,
			givenEvidence,
			otherHandIndexAfter,
			outcomeType: OutcomeType.Pike,
		};
		this.logger.info(() => formatPikeOutcome(outcome));
		return outcome;
	}

	private applyPursue(action: PursueAction, activePlayer: GamePlayer): PursueOutcome {
		const returnedEvidence = this.applyDeadLead(action.leadType, activePlayer.inspector);
		const outcome: PursueOutcome = {
			action,
			activePlayer,
			impossibleCount: this.board.impossibleCount,
			nextLead: this.board.leadFor(action.leadType),
			outcomeType: OutcomeType.Pursue,
			returnedEvidence,
		};
		this.logger.info(() => formatPursueOutcome(outcome, this.board));
		return outcome;
	}

	private applyToby(action: TobyAction, activePlayer: GamePlayer): TobyOutcome {
		if (!isPlayerInspector(activePlayer, InspectorType.Toby)) {
			throw new Error(`You are not Toby: ${formatPlayer(activePlayer)}`);
		}
		const peekedEvidence = this.board.dealEvidence();
		if (peekedEvidence == null) {
			throw new Error(`Cannot take evidence from an empty pile.`);
		}
		const bottomOrTop = action.onReveal(peekedEvidence);
		this.returnEvidence([peekedEvidence], false, bottomOrTop, ReturnEvidenceVisibility.Toby);
		const outcome: TobyOutcome = {
			action,
			activePlayer,
			bottomOrTop,
			outcomeType: OutcomeType.Toby,
		};
		this.logger.info(() => formatTobyOutcome(outcome, peekedEvidence));
		return outcome;
	}

	private broadcastOutcome(outcome: Outcome): void {
		for (const player of this.players) {
			player.sawOutcome(outcome);
		}
	}

	private checkGameCompletion(): void {
		if (this.board.allConfirmed) {
			if (this.board.investigationComplete) {
				this._state = GameState.Won;
			} else {
				this._lossReason = this.board.investigationOver ? LossReason.TooMuchInvestigation : LossReason.NotEnoughInvestigation;
				this._state = GameState.Lost;
			}
		} else if (this.board.anyEmptyLeads) {
			this._lossReason = LossReason.OutOfLeads;
			this._state = GameState.Lost;
		} else if (this.board.holmesWon) {
			this._lossReason = LossReason.HolmesWon;
			this._state = GameState.Lost;
		} else if (this.board.investigationOver) {
			this._lossReason = LossReason.TooMuchInvestigation;
			this._state = GameState.Lost;
		}
	}

	private dealEvidence(activePlayer?: GamePlayer | undefined): EvidenceCard | undefined {
		const wantEvidenceCount = activePlayer?.inspector === InspectorType.Blackwell ? 2 : 1;
		const evidences = range(1, wantEvidenceCount)
			.map(() => this.board.dealEvidence())
			.filter(isDefined);
		let evidence: EvidenceCard | undefined;
		if (evidences.length === 2 && isPlayerInspector(activePlayer, InspectorType.Blackwell)) {
			const previousPlayer = this.playerToTheRight(activePlayer);
			const blackwellChoice = previousPlayer.chooseForBlackwell({
				askBlackwellAboutTheirHand: (): OtherHand => activePlayer.otherHand,
				askOtherPlayerAboutTheirHand: (otherPlayer: OtherPlayer): OtherHand => {
					const other = this.findPlayer(otherPlayer);
					if (isSamePlayer(other, previousPlayer)) {
						throw new Error(`Cannot ask about your own hand: ${previousPlayer}`);
					} else if (isSamePlayer(other, activePlayer)) {
						throw new Error(`Blackwell player should be asked directly`);
					}
					return other.otherHand;
				},
				blackwell: activePlayer,
				board: this.board,
				evidences,
				otherPlayers: this.players.filter(p => p !== activePlayer && p !== previousPlayer),
			});
			this.returnEvidence([blackwellChoice.bury], false, BottomOrTop.Bottom, ReturnEvidenceVisibility.None);
			evidence = blackwellChoice.keep;
		} else {
			evidence = evidences.shift();
		}
		if (evidence != null && activePlayer != null) {
			const handIndex = activePlayer.hand.length;
			activePlayer.addCard(handIndex, evidence, true, false);
			for (const player of this.players) {
				player.sawEvidenceDealt(activePlayer, evidence, handIndex, false);
			}
		}
		return evidence;
	}

	private findPlayer(player: Player): GamePlayer {
		if (player instanceof GamePlayer) {
			return player;
		}
		return this.players.filter(p => isSamePlayer(p, player))[0];
	}

	public get lossReason(): LossReason | undefined {
		return this._lossReason;
	}

	private moveHolmes(delta: number): number {
		const holmesLocation = this.board.moveHolmes(delta);
		this.checkGameCompletion();
		return holmesLocation;
	}

	private playerToTheRight(activePlayer: GamePlayer): GamePlayer {
		return this.players[(this.players.indexOf(activePlayer) + this.players.length - 1) % this.players.length];
	}

	private returnEvidence(
		evidences: EvidenceCard[],
		shuffle: boolean,
		bottomOrTop: BottomOrTop,
		visibility: ReturnEvidenceVisibility,
	): void {
		this.logger.trace(() => `returnEvidence ${bottomOrTop} visible to ${visibility} ${evidences.map(e => formatEvidence(e)).join(", ")}`);
		this.board.returnEvidence(evidences, shuffle, bottomOrTop);
		for (const player of this.players) {
			const visible = visibility === ReturnEvidenceVisibility.All || (visibility === ReturnEvidenceVisibility.Toby && player.inspector === InspectorType.Toby) ? evidences : [];
			player.sawEvidenceReturned(visible, bottomOrTop, shuffle);
		}
	}

	public get state(): GameState {
		return this._state;
	}

	public step(): void {
		if (this._state !== GameState.Playing) {
			throw new Error(`Game is already finished`);
		}
		this.activePlayerNum = (this.activePlayerNum + 1) % this.players.length;
		this.turnCount++;
		const activePlayer = this.players[this.activePlayerNum];
		const nextPlayer = this.players[(this.activePlayerNum + 1) % this.players.length];
		const turnStart: TurnStart = {
			askOtherPlayerAboutTheirHand: (otherPlayer: OtherPlayer): OtherHand => {
				const other = this.findPlayer(otherPlayer);
				if (isSamePlayer(other, activePlayer)) {
					throw new Error(`Cannot ask about your own hand: ${activePlayer}`);
				}
				return other.otherHand;
			},
			board: this.board,
			nextPlayer,
			otherPlayers: this.players.filter(p => !isSamePlayer(p, activePlayer)),
			player: activePlayer,
		};
		this.logger.trace(() => `\n${this.turnCount}: ${formatLeadsProgress(this.board)}\n`);
		const action = activePlayer.takeTurn(turnStart);
		this.applyAction(action, activePlayer);
	}

	// noinspection JSUnusedGlobalSymbols  // used by JSON.stringify
	public toJSON(): Record<string, unknown> {
		return {
			activePlayerNum: this.activePlayerNum,
			board: this.board,
			cardsPerPlayer: this.cardsPerPlayer,
			players: this.players,
			turnCount: this.turnCount,
		};
	}

	public get turns(): number {
		return this.turnCount;
	}
}
