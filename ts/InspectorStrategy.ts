import { isAssistTypeOption, TypeAssistTurnOption } from "./AssistStrategy";
import { Bot } from "./Bot";
import { BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { MonoFunction } from "./Function";
import { Guard } from "./Guard";
import { InspectorType } from "./InspectorType";
import { TurnStart } from "./TurnStart";

export abstract class InspectorStrategy implements BotTurnStrategy {
	// noinspection JSUnusedGlobalSymbols
	public abstract get inspectorType(): InspectorType;

	public readonly strategyType: BotTurnStrategyType = BotTurnStrategyType.Inspector;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		return [];
	}

	protected memoizedOtherCards(turn: TurnStart): () => EvidenceCard[] {
		let cards: EvidenceCard[] | undefined = undefined;
		return function otherCards(): EvidenceCard[] {
			if (cards == null) {
				cards = turn.otherPlayers.flatMap(op => op.hand);
			}
			return cards;
		};
	}

	protected memoizedTypedCardValues(otherCards: () => EvidenceCard[], evidenceType: EvidenceType): () => number[] {
		let cards: number[] | undefined = undefined;
		return function cardValues(): number[] {
			if (cards == null) {
				cards = otherCards().filter(card => card.evidenceType === evidenceType).map(card => card.evidenceValue);
			}
			return cards;
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public processOptions(options: BotTurnOption[], removed: BotTurnOption[]): void {
		// do nothing
	}
}

export enum OnOptionProcessingResult {
	Keep = "Keep",
	Remove = "Remove",
}

export class OptionProcessingInspectorStrategy<I extends InspectorType, O extends BotTurnOption> extends InspectorStrategy {
	public constructor(
		public readonly inspectorType: I,
		private readonly guard: Guard<O>,
		private readonly onOption: MonoFunction<O, OnOptionProcessingResult | undefined>,
	) {
		super();
	}

	processOptions(options: BotTurnOption[], removed: BotTurnOption[]): void {
		for (let i = options.length - 1; i >= 0; i--) {
			const option = options[i];
			if (this.guard(option)) {
				const result = this.onOption(option);
				if (result === OnOptionProcessingResult.Remove) {
					options.splice(i, 1);
					removed.push(option);
				}
			}
		}
	}
}

export class CannotIdentifyTypeInspectorStrategy<I extends InspectorType, E extends EvidenceType> extends OptionProcessingInspectorStrategy<I, TypeAssistTurnOption> {
	public constructor(
		public readonly inspectorType: I,
		public readonly prohibitedEvidenceType: E,
	) {
		super(inspectorType, isAssistTypeOption, option => option.action.evidenceType === prohibitedEvidenceType ? OnOptionProcessingResult.Remove : OnOptionProcessingResult.Keep);
	}
}

export abstract class OncePerGameInspectorStrategy extends InspectorStrategy {
	private available = true;

	protected ifAvailable(block: () => void): void {
		if (this.available) {
			block();
		}
	}

	protected setUsed(): void {
		this.available = false;
	}
}

