import { Board } from "./Board";
import { ActivePlayer, isSamePlayer, OtherPlayer, Player } from "./Player";
import { CaseFileCard } from "./CaseFileCard";
import { EvidenceCard } from "./EvidenceCard";
import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { TurnStart } from "./TurnStart";
import { AssistAction, AssistOutcome, AssistType, isTypeAssistAction, isValueAssistAction } from "./AssistAction";
import { EliminateAction, EliminateOutcome, isEliminateAction } from "./EliminateAction";
import {
	BadInvestigateOutcome, DeadLeadInvestigateOutcome, GoodInvestigateOutcome,
	InvestigateAction,
	InvestigateOutcome,
	InvestigateOutcomeType,
	isInvestigateAction,
} from "./InvestigateAction";
import { isPursueAction, PursueAction, PursueOutcome } from "./PursueAction";
import { ConfirmAction, ConfirmOutcome, isConfirmAction } from "./ConfirmAction";
import { Outcome } from "./Outcome";
import { LEAD_TYPES, LeadType } from "./LeadType";
import { isLeadReverseCard } from "./LeadCard";
import { CardType } from "./CardType";

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

	public get hand(): EvidenceCard[] {
		return this._hand.slice();
	}

	public get name(): string {
		return this.player.name;
	}

	public removeCardAt(index: number): EvidenceCard {
		const card = this._hand[index];
		this._hand.splice(index, 1);
		return card;
	}

	public sawOutcome(outcome: Outcome): void {
		this.player.sawOutcome(outcome);
	}

	public takeTurn(turnStart: TurnStart): Action<ActionType> {
		return this.player.takeTurn(turnStart);
	}
}

export const HOLMES_GOAL = 0;
export const INVESTIGATION_MARKER_GOAL = 20;

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
	}

	private applyAction(
		action: Action<ActionType>,
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

	private applyAssist(action: AssistAction<AssistType>, activePlayer: GamePlayer): AssistOutcome {
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
		return {
			action,
			activePlayer,
			identifiedHandIndexes: assistedPlayer.hand
				.map((card, index) => cardMatcher(card) ? index : -1)
				.filter(index => index >= 0),
		};
	}

	private applyConfirm(action: ConfirmAction, activePlayer: GamePlayer): ConfirmOutcome {
		if (this.board.isConfirmed(action.leadType)) {
			throw new Error(`Already confirmed: ${action}`);
		}
		if (this.board.calculateGapFor(action.leadType) !== 0) {
			throw new Error(`Cannot confirm that lead: ${action}`);
		}
		this.board.confirm(action.leadType);
		this.board.moveHolmes(-1);
		return {
			action,
			activePlayer,
			confirmedLeadTypes: LEAD_TYPES.filter(leadType => this.board.isConfirmed(leadType)),
			holmesLocation: this.board.holmesLocation,
			unconfirmedLeadTypes: LEAD_TYPES.filter(leadType => !this.board.isConfirmed(leadType)),
		};
	}

	private applyDeadLead(leadType: LeadType): EvidenceCard[] {
		this.board.removeLead(leadType);
		this.board.addImpossible({ cardType: CardType.LeadReverse });
		const returnedEvidence = this.board.removeEvidenceFor(leadType);
		this.board.returnEvidence(returnedEvidence);
		return returnedEvidence;
	}

	private applyEliminate(action: EliminateAction, activePlayer: GamePlayer): EliminateOutcome {
		const card = activePlayer.removeCardAt(action.handIndex);
		if (card == null) {
			throw new Error(`Unknown card index for ${activePlayer}: ${action.handIndex}`);
		}
		this.board.addImpossible(card);
		const investigationMarker = this.board.moveInvestigationMarker(card.evidenceValue);
		const impossibleCards = this.board.impossibleCards;
		const impossibleFaceDownCount = impossibleCards.filter(c => isLeadReverseCard(c)).length;
		return {
			action,
			activePlayer,
			impossibleCards,
			impossibleFaceDownCount,
			investigationMarker,
		};
	}

	private applyInvestigate(action: InvestigateAction, activePlayer: GamePlayer): InvestigateOutcome<InvestigateOutcomeType> {
		const evidenceCard = activePlayer.removeCardAt(action.handIndex);
		const evidenceType = this.board.evidenceTypeFor(action.leadType);
		if (evidenceCard == null) {
			throw new Error(`Player ${activePlayer} does not have card for action ${action}`);
		}
		if (evidenceType !== evidenceCard.evidenceType) {
			this.board.addBad(action.leadType, evidenceCard);
			const badValue = this.board.calculateBadFor(action.leadType);
			const targetValue = this.board.targetForLead(action.leadType);
			return <BadInvestigateOutcome> {
				action,
				activePlayer,
				badValue,
				evidenceCard,
				investigateOutcomeType: InvestigateOutcomeType.Bad,
				targetValue,
				totalValue: badValue + targetValue,
			};
		}
		this.board.addEvidence(action.leadType, evidenceCard);
		const gap = this.board.calculateGapFor(action.leadType);
		if (gap < 0) {
			const returnedEvidence = this.applyDeadLead(action.leadType);
			return <DeadLeadInvestigateOutcome> {
				action,
				activePlayer,
				evidenceCard,
				impossibleCount: this.board.impossibleCount,
				investigateOutcomeType: InvestigateOutcomeType.DeadLead,
				nextLead: this.board.leadFor(action.leadType),
				returnedEvidence,
			};
		}
		return <GoodInvestigateOutcome> {
			accumulatedValue: this.board.calculateEvidenceValueFor(action.leadType),
			action,
			activePlayer,
			badValue: this.board.calculateBadFor(action.leadType),
			evidenceCard,
			investigateOutcomeType: InvestigateOutcomeType.Good,
			targetValue: this.board.targetForLead(action.leadType),
			totalValue: this.board.calculateTotalFor(action.leadType),
		};
	}

	private applyPursue(action: PursueAction, activePlayer: GamePlayer): PursueOutcome {
		const returnedEvidence = this.applyDeadLead(action.leadType);
		return <PursueOutcome> {
			action,
			activePlayer,
			impossibleCount: this.board.impossibleCount,
			nextLead: this.board.leadFor(action.leadType),
			returnedEvidence,
		};
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
		const action = activePlayer.takeTurn({
			board: this.board,
			otherPlayers: this.players.filter(p => p !== activePlayer),
		});
		this.applyAction(action, activePlayer);
	}

}
