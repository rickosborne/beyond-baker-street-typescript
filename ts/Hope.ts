import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { addEffectsEvenIfDuplicate, addEffectsIfNotPresent } from "./addEffect";
import { AssistAction, AssistOutcome, formatAssist, formatAssistOutcome } from "./AssistAction";
import { AssistTurnOption, isAssistOption } from "./AssistStrategy";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { pairedPermutations } from "./pairedPermutations";
import { InspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";
import { removeIf } from "./removeIf";

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

export function unifyEffectsForAssists(
	assists: [ AssistTurnOption, AssistTurnOption ],
): BotTurnEffectType[] {
	return assists.reduce((effects, assist) => {
		for (const effect of assist.effects) {
			if (effect === BotTurnEffectType.HolmesProgress) {
				// Hope only advances Holmes once
				addEffectsIfNotPresent(effects, effect);
			} else {
				// Everything else should be double-counted if necessary
				addEffectsEvenIfDuplicate(effects, effect);
			}
		}
		return effects;
	}, [] as BotTurnEffectType[]);
}

export function buildHopeOptionForActions(
	assists: [ AssistAction, AssistAction ],
	effects: BotTurnEffectType[],
): HopeOption {
	return {
		action: {
			actionType: ActionType.Hope,
			assists,
		},
		effects,
		strategyType: BotTurnStrategyType.Inspector,
	};
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
		const hopeOptions = pairedPermutations(assists)
			.map(pair => {
				const actions = pair.map(a => a.action) as [ AssistAction, AssistAction ];
				const effects = unifyEffectsForAssists(pair);
				return buildHopeOptionForActions(actions, effects);
			});
		removeIf(options, isAssistOption);  // Only dual-assist
		options.push(...hopeOptions);
	}
}
