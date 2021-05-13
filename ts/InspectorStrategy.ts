import { Bot } from "./Bot";
import { BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { InspectorType } from "./InspectorType";
import { TurnStart } from "./TurnStart";

export abstract class InspectorStrategy implements BotTurnStrategy {
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

	protected whenAvailable<T>(block: () => T, defaultValue: T): T {
		if (this.available) {
			return block();
		}
		return defaultValue;
	}
}

