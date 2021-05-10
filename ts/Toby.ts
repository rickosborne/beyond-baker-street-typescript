import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { EvidenceCard, formatEvidence } from "./EvidenceCard";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { InspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Logger } from "./logger";
import { formatMysteryCard, MysteryCard } from "./MysteryCard";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";

export enum BottomOrTop {
	Bottom = "Bottom",
	Top = "Top",
}

export interface TobyAction extends Action {
	actionType: ActionType.Toby;
	onReveal: (evidenceCard: EvidenceCard) => BottomOrTop;
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

export class TobyInspectorStrategy extends InspectorStrategy {
	public readonly inspectorType = InspectorType.Toby;
	private peekedEvidence: EvidenceCard | undefined;

	constructor(private readonly logger: Logger) {
		super();
	}

	public addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean, mysteryCard: MysteryCard): EvidenceCard | undefined {
		const peeked = this.peekedEvidence;
		if (fromRemainingEvidence && evidenceCard == null && peeked != null) {
			if (!mysteryCard.couldBe(peeked)) {
				throw new Error(`Toby saw ${formatEvidence(peeked)} but it's not possible according to ${formatMysteryCard(mysteryCard)}`);
			}
			this.logger.info(() => `Toby was dealt a card, and knew it was ${formatEvidence(peeked)}.`);
			mysteryCard.setExact(peeked);
			this.peekedEvidence = undefined;
		}
		return peeked;
	}

	public buildOptions(turn: TurnStart, bot: Bot): TobyOption[] {
		const options: TobyOption[] = [];
		if (turn.board.remainingEvidenceCount > 0 && this.peekedEvidence == null) {
			options.push({
				action: {
					actionType: ActionType.Toby,
					onReveal: evidenceCard => {
						const { evidenceType, evidenceValue } = evidenceCard;
						if (!bot.remainingEvidence.couldBe(evidenceCard)) {
							throw new Error(`Toby peeked at ${formatEvidence(evidenceCard)} which was not possible according to remaining evidence.`);
						}
						const leads = unfinishedLeads(turn);
						const leadsOfType = leads.filter(lead => lead.leadCard.evidenceType === evidenceType);
						const investigationGap = INVESTIGATION_MARKER_GOAL - turn.board.investigationMarker;
						const putOnTop = (): BottomOrTop.Top => {
							this.peekedEvidence = evidenceCard;
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
					},
				},
				effects: [BotTurnEffectType.Toby],
				strategyType: BotTurnStrategyType.Inspector,
			});
		}
		return options;
	}

	public sawEvidenceDealt(): void {
		const peeked = this.peekedEvidence;
		if (peeked != null) {
			this.logger.info(() => `Toby saw evidence dealt and forgot about ${formatEvidence(peeked)}.`);
			this.peekedEvidence = undefined;
		}
	}

	public sawEvidenceReturned(evidenceCards: EvidenceCard[], bottomOrTop: BottomOrTop, shuffle: boolean): void {
		const peeked = this.peekedEvidence;
		if (peeked != null && (shuffle || (bottomOrTop === BottomOrTop.Top && evidenceCards.length !== 1))) {
			this.logger.info(() => `Toby saw evidence returned (${shuffle ? "shuffled" : `${bottomOrTop}+${evidenceCards.length}`}) and forgot about ${formatEvidence(peeked)}.`);
			this.peekedEvidence = undefined;
		}
	}
}
