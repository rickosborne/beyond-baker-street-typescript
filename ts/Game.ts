import { Board } from "./Board";
import { ActivePlayer, isSamePlayer, OtherPlayer, Player } from "./Player";
import { CaseFileCard, formatCaseFileCard } from "./CaseFileCard";
import { EvidenceCard } from "./EvidenceCard";
import { Action } from "./Action";
import { TurnStart } from "./TurnStart";
import {
	AssistAction,
	AssistOutcome,
	formatAssistOutcome,
	isTypeAssistAction,
	isValueAssistAction,
} from "./AssistAction";
import { EliminateAction, EliminateOutcome, formatEliminateOutcome, isEliminateAction } from "./EliminateAction";
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
import { formatPursueOutcome, isPursueAction, PursueAction, PursueOutcome } from "./PursueAction";
import { ConfirmAction, ConfirmOutcome, formatConfirmOutcome, isConfirmAction } from "./ConfirmAction";
import { Outcome, OutcomeType } from "./Outcome";
import { LEAD_TYPES, LeadType } from "./LeadType";
import { formatLeadCard, isLeadReverseCard } from "./LeadCard";
import { CardType } from "./CardType";
import { OtherHand } from "./OtherHand";

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

class GamePlayer implements OtherPlayer, ActivePlayer {
	constructor(
		public readonly player: ActivePlayer,
		private readonly _hand: EvidenceCard[] = [],
	) {
	}

	public addCard(index: number, evidenceCard: EvidenceCard | undefined, playerSawCard = false): void {
		if (evidenceCard == null) {
			throw new Error(`Expected evidence card at ${index}`);
		}
		this._hand.splice(index, 0, evidenceCard);
		this.player.addCard(index, playerSawCard ? evidenceCard : undefined);
	}

	public get hand(): EvidenceCard[] {
		return this._hand.slice();
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

	public sawOutcome(outcome: Outcome): void {
		this.player.sawOutcome(outcome);
	}

	public setHandCount(handCount: number): void {
		this.player.setHandCount(handCount);
	}

	public takeTurn(turnStart: TurnStart): Action {
		return this.player.takeTurn(turnStart);
	}
}

export const HOLMES_GOAL = 0;
export const INVESTIGATION_MARKER_GOAL = 20;
export const HOLMES_MOVE_ASSIST = -1;
export const HOLMES_MOVE_CONFIRM = 1;

export class Game {
	private activePlayerNum = -1;
	private readonly board: Board;
	private readonly players: GamePlayer[];
	private turnCount = 0;

	constructor(
		public readonly caseFile: CaseFileCard,
		players: ActivePlayer[],
	) {
		this.board = new Board(caseFile);
		this.players = players.map(p => new GamePlayer(p));
		const cardsPerPlayer = CARDS_PER_PLAYER[players.length];
		if (isNaN(cardsPerPlayer)) {
			throw new Error(`Invalid number of players: ${players.length}`);
		}
		for (let i = 0; i < cardsPerPlayer; i++) {
			for (const player of this.players) {
				const evidence = this.board.dealEvidence();
				if (evidence == null) {
					throw new Error(`Could not deal out all cards`);
				}
				player.addCard(i, evidence, false);
			}
		}
		console.log(`Game started with case file ${formatCaseFileCard(caseFile)} and players ${players.map(p => p.name).join(', ')}. Leads are: ${LEAD_TYPES.map(leadType => formatLeadCard(this.board.leads[leadType].leadCard)).join(", ")}.`);
	}

	private applyAction(
		action: Action,
		activePlayer: GamePlayer,
	): void {
		let outcome: Outcome;
		if (isTypeAssistAction(action) || isValueAssistAction(action)) {
			outcome = this.applyAssist(action, activePlayer);
		} else if (isConfirmAction(action)) {
			outcome = this.applyConfirm(action, activePlayer);
		} else if (isEliminateAction(action)) {
			outcome = this.applyEliminate(action, activePlayer);
		} else if (isInvestigateAction(action)) {
			outcome = this.applyInvestigate(action, activePlayer);
		} else if (isPursueAction(action)) {
			outcome = this.applyPursue(action, activePlayer);
		} else {
			throw new Error(`Unknown action: ${action}`);
		}
		this.broadcastOutcome(outcome);
	}

	private applyAssist(action: AssistAction, activePlayer: GamePlayer): AssistOutcome {
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
		this.board.moveHolmes(HOLMES_MOVE_ASSIST);
		const outcome: AssistOutcome = {
			action,
			activePlayer,
			holmesLocation: this.board.holmesLocation,
			identifiedHandIndexes: assistedPlayer.hand
				.map((card, index) => cardMatcher(card) ? index : -1)
				.filter(index => index >= 0),
			outcomeType: OutcomeType.Assist,
		};
		console.log(formatAssistOutcome(outcome));
		return outcome;
	}

	private applyConfirm(action: ConfirmAction, activePlayer: GamePlayer): ConfirmOutcome {
		if (this.board.isConfirmed(action.leadType)) {
			throw new Error(`Already confirmed: ${action}`);
		}
		if (this.board.calculateGapFor(action.leadType) !== 0) {
			throw new Error(`Cannot confirm that lead: ${action}`);
		}
		this.board.confirm(action.leadType);
		this.board.moveHolmes(HOLMES_MOVE_CONFIRM);
		const outcome: ConfirmOutcome = {
			action,
			activePlayer,
			confirmedLeadTypes: LEAD_TYPES.filter(leadType => this.board.isConfirmed(leadType)),
			holmesLocation: this.board.holmesLocation,
			outcomeType: OutcomeType.Confirm,
			unconfirmedLeadTypes: LEAD_TYPES.filter(leadType => !this.board.isConfirmed(leadType)),
		};
		console.log(formatConfirmOutcome(outcome));
		return outcome;
	}

	private applyDeadLead(leadType: LeadType): EvidenceCard[] {
		this.board.removeLead(leadType);
		this.board.addImpossible({ cardType: CardType.LeadReverse });
		const returnedEvidence = this.board.removeEvidenceFor(leadType);
		this.board.returnEvidence(returnedEvidence);
		return returnedEvidence;
	}

	private applyEliminate(action: EliminateAction, activePlayer: GamePlayer): EliminateOutcome {
		const evidenceCard = activePlayer.removeCardAt(action.handIndex);
		if (evidenceCard == null) {
			throw new Error(`Unknown card index for ${activePlayer}: ${action.handIndex}`);
		}
		this.board.addImpossible(evidenceCard);
		const investigationMarker = this.board.moveInvestigationMarker(evidenceCard.evidenceValue);
		const impossibleCards = this.board.impossibleCards;
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
		console.log(formatEliminateOutcome(outcome));
		return outcome;
	}

	private applyInvestigate(action: InvestigateAction, activePlayer: GamePlayer): InvestigateOutcome {
		const evidenceCard = activePlayer.removeCardAt(action.handIndex);
		const evidenceType = this.board.evidenceTypeFor(action.leadType);
		if (evidenceCard == null) {
			throw new Error(`Player ${activePlayer} does not have card for action ${action}`);
		}
		if (evidenceType !== evidenceCard.evidenceType) {
			this.board.addBad(action.leadType, evidenceCard);
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
			console.log(formatBadInvestigateOutcome(outcome));
			return outcome;
		}
		this.board.addEvidence(action.leadType, evidenceCard);
		const gap = this.board.calculateGapFor(action.leadType);
		if (gap < 0) {
			const returnedEvidence = this.applyDeadLead(action.leadType);
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
			console.log(formatDeadLeadInvestigateOutcome(outcome));
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
		console.log(formatGoodInvestigateOutcome(outcome));
		return outcome;
	}

	private applyPursue(action: PursueAction, activePlayer: GamePlayer): PursueOutcome {
		const returnedEvidence = this.applyDeadLead(action.leadType);
		const outcome: PursueOutcome = {
			action,
			activePlayer,
			impossibleCount: this.board.impossibleCount,
			nextLead: this.board.leadFor(action.leadType),
			outcomeType: OutcomeType.Pursue,
			returnedEvidence,
		};
		console.log(formatPursueOutcome(outcome));
		return outcome;
	}

	private broadcastOutcome(outcome: Outcome): void {
		for (const player of this.players) {
			player.sawOutcome(outcome);
		}
	}

	private findPlayer(player: Player): GamePlayer {
		if (player instanceof GamePlayer) {
			return player;
		}
		return this.players.filter(p => isSamePlayer(p, player))[0];
	}

	public get state(): GameState {
		const allConfirmed = this.board.allConfirmed;
		const investigationMarker = this.board.investigationMarker;
		if (allConfirmed && (investigationMarker === INVESTIGATION_MARKER_GOAL)) {
			return GameState.Won;
		}
		if (
			(this.board.holmesLocation <= HOLMES_GOAL)
			|| (investigationMarker > INVESTIGATION_MARKER_GOAL)
			|| this.board.anyEmptyLeads
			|| allConfirmed
		) {
			return GameState.Lost;
		}
		return GameState.Playing;
	}

	public step(): void {
		if (this.state !== GameState.Playing) {
			throw new Error(`Game is already finished`);
		}
		this.activePlayerNum = (this.activePlayerNum + 1) % this.players.length;
		this.turnCount++;
		const activePlayer = this.players[this.activePlayerNum];
		const turnStart: TurnStart = {
			askOtherPlayerAboutTheirHand: (otherPlayer: OtherPlayer): OtherHand => {
				const other = this.findPlayer(otherPlayer);
				if (isSamePlayer(other, activePlayer)) {
					throw new Error(`Cannot ask about your own hand: ${activePlayer}`);
				}
				return other.otherHand;
			},
			board: this.board,
			otherPlayers: this.players.filter(p => !isSamePlayer(p, activePlayer)),
			player: activePlayer,
		};
		const action = activePlayer.takeTurn(turnStart);
		this.applyAction(action, activePlayer);
	}

}
