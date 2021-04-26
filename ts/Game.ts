import { Board } from "./Board";
import { ActivePlayer, isSamePlayer, OtherPlayer, Player } from "./Player";
import { CaseFileCard } from "./CaseFileCard";
import { EvidenceCard } from "./EvidenceCard";
import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { TurnStart } from "./TurnStart";
import {
	AssistAction, AssistOutcome, AssistType,
	isTypeAssistAction,
	isValueAssistAction,
} from "./AssistAction";
import { isEliminateAction } from "./EliminateAction";
import { isInvestigateAction } from "./InvestigateAction";
import { isPursueAction } from "./PursueAction";
import { ConfirmAction, ConfirmOutcome, isConfirmAction } from "./ConfirmAction";
import { Outcome } from "./Outcome";
import { LEAD_TYPES } from "./LeadType";

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

	public sawOutcome(outcome: Outcome): void {
		this.player.sawOutcome(outcome);
	}

	public takeTurn(turnStart: TurnStart): Action<ActionType> {
		return this.player.takeTurn(turnStart);
	}
}

export class Game {
	private activePlayerNum = -1;
	private readonly board: Board;
	private finished = false;
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
			this.applyEliminate(action, activePlayer);
		} else if (isInvestigateAction(action)) {
			this.applyInvestigate(action, activePlayer);
		} else if (isPursueAction(action)) {
			this.applyPursue(action, activePlayer);
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

	public get isFinished(): boolean {
		return this.finished;
	}

	public step(): void {
		if (this.isFinished) {
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
