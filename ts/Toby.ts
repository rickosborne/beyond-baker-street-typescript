import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { EvidenceCard, formatEvidence, isSameEvidenceCard } from "./EvidenceCard";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { InspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Logger } from "./logger";
import { formatMysteryCard, MysteryCard } from "./MysteryCard";
import { MysteryPile } from "./MysteryPile";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";
import { strictDeepEqual } from "./strictDeepEqual";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unfinishedLeads";

export enum BottomOrTop {
	Bottom = "Bottom",
	Top = "Top",
}

export type TobyActionOnReveal = (evidenceCard: EvidenceCard) => BottomOrTop;

export interface TobyAction extends Action {
	actionType: ActionType.Toby;
	onReveal: TobyActionOnReveal;
}

export interface TobyOption extends BotTurnOption {
	action: TobyAction;
	effects: [BotTurnEffectType.Toby];
	strategyType: BotTurnStrategyType.Inspector;
}

export interface TobyOutcome extends Outcome {
	action: TobyAction;
	activePlayer: PlayerInspector<InspectorType.Toby>;
	bottomOrTop: BottomOrTop;
	outcomeType: OutcomeType.Toby;
}

export function isTobyAction(maybe: unknown): maybe is TobyAction {
	return (maybe != null) && ((maybe as TobyAction).actionType === ActionType.Toby);
}

export function isTobyOutcome(maybe: unknown): maybe is TobyOutcome {
	return (maybe != null) && ((maybe as TobyOutcome).outcomeType === OutcomeType.Toby);
}

export function formatTobyAction(action: TobyAction, player: Player, remainingEvidenceCount: number): string {
	return `${player.name} peeked at remaining evidence.  ${remainingEvidenceCount} evidence remain${remainingEvidenceCount === 1 ? "" : "s"}.`;
}

export function formatTobyOutcome(outcome: TobyOutcome, peekedEvidence?: EvidenceCard): string {
	return `${outcome.activePlayer.name} peeked at remaining evidence${peekedEvidence == null ? "" : `, saw ${formatEvidence(peekedEvidence)}`}, then put it back on ${outcome.bottomOrTop}.`;
}

export function buildTobyOnReveal(
	turn: TurnStart,
	mysteryPile: MysteryPile,
	setPeekedEvidence: (peekedEvidence: EvidenceCard | undefined) => void,
): TobyActionOnReveal {
	return function tobyOnReveal(evidenceCard: EvidenceCard): BottomOrTop {
		const { evidenceType, evidenceValue } = evidenceCard;
		// istanbul ignore if
		if (!mysteryPile.couldBe(evidenceCard)) {
			throw new Error(`Toby peeked at ${formatEvidence(evidenceCard)} which was not possible according to remaining evidence.`);
		}
		const leads = unfinishedLeads(turn);
		const leadsOfType = leads.filter(lead => lead.leadCard.evidenceType === evidenceType);
		const investigationGap = INVESTIGATION_MARKER_GOAL - turn.board.investigationMarker;
		const putOnTop = (): BottomOrTop.Top => {
			setPeekedEvidence(evidenceCard);
			return BottomOrTop.Top;
		};
		if (investigationGap === evidenceValue) {
			return putOnTop();
		}
		for (const lead of leadsOfType) {
			const leadGap = (lead.badValue + lead.leadCard.evidenceTarget) - lead.evidenceValue;
			if (leadGap >= evidenceValue) {
				return putOnTop();
			} else if (leadGap < evidenceValue) {
				return BottomOrTop.Bottom;
			}
		}
		if (evidenceValue < investigationGap) {
			return putOnTop();
		}
		return BottomOrTop.Bottom;
	};
}

export function buildTobyOption(
	onReveal: TobyActionOnReveal,
): TobyOption {
	return {
		action: {
			actionType: ActionType.Toby,
			onReveal,
		},
		effects: [BotTurnEffectType.Toby],
		strategyType: BotTurnStrategyType.Inspector,
	};
}

export class TobyInspectorStrategy extends InspectorStrategy {
	public readonly inspectorType = InspectorType.Toby;
	private peekedEvidence: EvidenceCard | undefined;

	constructor(private readonly logger?: Logger | undefined) {
		super();
	}

	public addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean, mysteryCard: MysteryCard): EvidenceCard | undefined {
		const peeked = this.peekedEvidence;
		if (fromRemainingEvidence && evidenceCard == null && peeked != null) {
			// istanbul ignore if
			if (!mysteryCard.couldBe(peeked)) {
				throw new Error(`Toby saw ${formatEvidence(peeked)} but it's not possible according to ${formatMysteryCard(mysteryCard)}`);
			}
			// istanbul ignore if
			if (this.logger != null) {
				this.logger.info(() => `Toby was dealt a card, and knew it was ${formatEvidence(peeked)}.`);
			}
			mysteryCard.setExact(peeked);
			this.peekedEvidence = undefined;
		}
		return peeked;
	}

	public buildOptions(turn: TurnStart, bot: Bot): TobyOption[] {
		const options: TobyOption[] = [];
		if (turn.board.remainingEvidenceCount > 0 && this.peekedEvidence == null) {
			const onReveal = buildTobyOnReveal(turn, bot.remainingEvidence, peeked => this.peekedEvidence = peeked);
			options.push(buildTobyOption(onReveal));
		}
		return options;
	}

	public get rememberedEvidence(): EvidenceCard | undefined {
		return this.peekedEvidence;
	}

	public sawEvidenceDealt(): void {
		const peeked = this.peekedEvidence;
		if (peeked != null) {
			// istanbul ignore if
			if (this.logger != null) {
				this.logger.info(() => `Toby saw evidence dealt and forgot about ${formatEvidence(peeked)}.`);
			}
			this.peekedEvidence = undefined;
		}
	}

	public sawEvidenceReturned(evidenceCards: EvidenceCard[], bottomOrTop: BottomOrTop, shuffle: boolean): void {
		const peeked = this.peekedEvidence;
		if (peeked != null && (
			shuffle
			|| (bottomOrTop === BottomOrTop.Top && !strictDeepEqual(evidenceCards, [peeked]))
			|| (bottomOrTop === BottomOrTop.Bottom && evidenceCards.findIndex(c => isSameEvidenceCard(c, peeked)) >= 0))
		) {
			// istanbul ignore if
			if (this.logger != null) {
				this.logger.info(() => `Toby saw evidence returned (${shuffle ? "shuffled" : `${bottomOrTop}+${evidenceCards.length}`}) and forgot about ${formatEvidence(peeked)}.`);
			}
			this.peekedEvidence = undefined;
		}
	}
}
