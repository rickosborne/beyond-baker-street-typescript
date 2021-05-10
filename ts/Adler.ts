import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { HOLMES_MAX } from "./Game";
import { OncePerGameInspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";
import { TurnStart } from "./TurnStart";

export interface AdlerOption extends BotTurnOption {
	action: AdlerAction;
	effects: [BotTurnEffectType.HolmesImpeded];
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

export function isAdlerOption(maybe: unknown): maybe is AdlerOption {
	const ao = maybe as AdlerOption;
	return (maybe != null) && (ao.strategyType === BotTurnStrategyType.Inspector && isActionOfType(ao.action, ActionType.Adler));
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
					effects: [BotTurnEffectType.HolmesImpeded],
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
