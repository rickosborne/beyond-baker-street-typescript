import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { addEffectsEvenIfDuplicate, addEffectsIfNotPresent } from "./addEffect";
import { AssistAction, AssistOutcome, formatAssist, formatAssistOutcome } from "./AssistAction";
import { isAssistOption } from "./AssistStrategy";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { pairedPermutations } from "./pairedPermutations";
import { InspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";

export interface HopeAction extends Action {
	actionType: ActionType.Hope;
	assists: AssistAction[];
}

export interface HopeOption extends BotTurnOption {
	action: HopeAction;
	strategyType: BotTurnStrategyType.Inspector;
}

export interface HopeOutcome extends Outcome {
	action: HopeAction;
	activePlayer: PlayerInspector<InspectorType.Hope>;
	assistOutcomes: AssistOutcome[];
	outcomeType: OutcomeType.Hope;
}

export function isHopeAction(maybe: unknown): maybe is HopeAction {
	return (maybe != null) && ((maybe as HopeAction).actionType === ActionType.Hope);
}

export function isHopeOutcome(maybe: unknown): maybe is HopeOutcome {
	return (maybe != null) && ((maybe as HopeOutcome).outcomeType === OutcomeType.Hope);
}

export function formatHopeAction(action: HopeAction, player: Player, holmesLocation: number): string {
	return `${player.name} assists twice: ${action.assists.map(a => formatAssist(a, player, holmesLocation)).join(", ")}`;
}

export function formatHopeOutcome(outcome: HopeOutcome): string {
	return `${outcome.activePlayer.name} assisted twice: ${outcome.assistOutcomes.map(o => formatAssistOutcome(o)).join(", ")}.`;
}

/**
 * Hope assists twice but only moves Holmes once.
 */
export class HopeInspectorStrategy extends InspectorStrategy {
	public readonly inspectorType = InspectorType.Hope;

	public processOptions(options: BotTurnOption[]): void {
		const assists = options.filter(isAssistOption);
		if (assists.length < 2) {
			return;
		}
		const pairs = pairedPermutations(assists);
		options.push(...pairs.map(assists => <HopeOption>{
			action: {
				actionType: ActionType.Hope,
				assists: assists.map(assist => assist.action),
			},
			effects: assists.reduce((effects, assist) => {
				assist.effects.forEach(effect => {
					if (effect === BotTurnEffectType.HolmesProgress) {
						addEffectsIfNotPresent(effects, effect);
					} else {
						addEffectsEvenIfDuplicate(effects, effect);
					}
				});
				if (effects.filter(effect => effect === BotTurnEffectType.HolmesProgress).length > 1) {
					throw new Error(`Multiple HolmesProgress effects for Hope`);
				}
				return effects;
			}, [] as BotTurnEffectType[]),
			strategyType: BotTurnStrategyType.Inspector,
		}));
	}
}
