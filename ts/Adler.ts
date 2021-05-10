import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { HOLMES_MAX } from "./Game";
import { HolmesImpededEffect } from "./HolmesProgressEffect";
import { OncePerGameInspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";
import { TurnStart } from "./TurnStart";

export interface AdlerOption extends BotTurnOption {
	action: AdlerAction;
	strategyType: BotTurnStrategyType.Inspector;
}

export interface AdlerAction extends Action {
	actionType: ActionType.Adler;
}

export interface AdlerOutcome extends Outcome {
	action: AdlerAction;
	activePlayer: PlayerInspector<InspectorType.Adler>;
	holmesLocation: number;
	outcomeType: OutcomeType.Adler;
}

export function isAdlerAction(maybe: unknown): maybe is AdlerAction {
	return (maybe != null) && ((maybe as AdlerAction).actionType === ActionType.Adler);
}

export function isAdlerOutcome(maybe: unknown): maybe is AdlerOutcome {
	return (maybe != null) && ((maybe as AdlerOutcome).outcomeType === OutcomeType.Adler);
}

export function formatAdlerAction(action: AdlerAction, player: Player, holmesLocation: number): string {
	return `${player.name} impeded Holmes.  Holmes is at ${holmesLocation}.`;
}

export function formatAdlerOutcome(outcome: AdlerOutcome): string {
	return formatAdlerAction(outcome.action, outcome.activePlayer, outcome.holmesLocation);
}

export class AdlerInspectorStrategy extends OncePerGameInspectorStrategy {
	public readonly inspectorType = InspectorType.Adler;

	public buildOptions(turn: TurnStart): BotTurnOption[] {
		const options: BotTurnOption[] = [];
		this.ifAvailable(() => {
			if (turn.board.holmesLocation < HOLMES_MAX) {
				options.push(<AdlerOption>{
					action: {
						actionType: ActionType.Adler,
					},
					effects: [
						<HolmesImpededEffect>{
							delta: 1,
							effectType: BotTurnEffectType.HolmesImpeded,
							inspector: InspectorType.Adler,
						},
					],
					strategyType: BotTurnStrategyType.Inspector,
				});
			}
		});
		return options;
	}

	public sawAdlerOutcome(): void {
		this.setUsed();
	}
}
