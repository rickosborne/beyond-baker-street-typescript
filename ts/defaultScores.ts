import { BOT_TURN_EFFECT_TYPES, BotTurnEffectType, isBotTurnEffectType } from "./BotTurn";
import { EffectWeightOp } from "./EffectWeight";
import { strictDeepEqual } from "./strictDeepEqual";

export type EffectWeightOpsFromType = Record<BotTurnEffectType, EffectWeightOp[]>;
// {"AssistExactEliminate":[17],"AssistImpossibleType":[-25],"AssistKnown":[7],"AssistNarrow":[5],"AssistNextPlayer":[7],"Confirm":[3],"EliminateKnownUnusedValue":[43],"EliminateKnownUsedValue":[10],"EliminateSetsUpExact":[4],"EliminateStompsExact":[7],"EliminateUnknownValue":[-2],"EliminateUnusedType":[16],"EliminateUsedType":[7],"EliminateWild":[-3],"HolmesImpeded":[0],"HolmesProgress":[-17],"ImpossibleAdded":[7],"InvestigateBad":[-12],"InvestigateCorrectType":[8],"InvestigateCorrectValue":[-3],"InvestigateMaybeBad":[-21],"InvestigatePerfect":[17],"InvestigateWild":[-8],"Lose":[-1000],"MaybeLose":[-24],"PursueDuplicate":[31],"PursueImpossible":[36],"PursueMaybe":[-11],"PursuePossible":[-29],"Win":[1000]}
export const DEFAULT_SCORE_FROM_TYPE: EffectWeightOpsFromType = {
	[BotTurnEffectType.AssistExactEliminate]: [17],
	[BotTurnEffectType.AssistImpossibleType]: [-25],
	[BotTurnEffectType.AssistKnown]: [7],
	[BotTurnEffectType.AssistNarrow]: [5],
	[BotTurnEffectType.AssistNextPlayer]: [7],
	[BotTurnEffectType.Confirm]: [3],
	[BotTurnEffectType.EliminateKnownUnusedValue]: [43],
	[BotTurnEffectType.EliminateKnownUsedValue]: [-10],
	[BotTurnEffectType.EliminateSetsUpExact]: [4],
	[BotTurnEffectType.EliminateStompsExact]: [-20],
	[BotTurnEffectType.EliminateUnknownValue]: [-2],
	[BotTurnEffectType.EliminateUnusedType]: [16],
	[BotTurnEffectType.EliminateUsedType]: [-20],
	[BotTurnEffectType.EliminateWild]: [-3],
	[BotTurnEffectType.HolmesImpeded]: [0],
	[BotTurnEffectType.HolmesProgress]: [-17],
	[BotTurnEffectType.ImpossibleAdded]: [0],
	[BotTurnEffectType.InvestigateBad]: [-12],
	[BotTurnEffectType.InvestigateCorrectType]: [8],
	[BotTurnEffectType.InvestigateCorrectValue]: [-3],
	[BotTurnEffectType.InvestigateMaybeBad]: [-21],
	[BotTurnEffectType.InvestigatePerfect]: [17],
	[BotTurnEffectType.InvestigateWild]: [-8],
	[BotTurnEffectType.Lose]: [-1000],
	[BotTurnEffectType.MaybeLose]: [-24],
	[BotTurnEffectType.PursueDuplicate]: [31],
	[BotTurnEffectType.PursueImpossible]: [36],
	[BotTurnEffectType.PursueMaybe]: [-11],
	[BotTurnEffectType.PursuePossible]: [-29],
	[BotTurnEffectType.Win]: [1000],

	[BotTurnEffectType.InvestigationComplete]: [37],
	[BotTurnEffectType.Toby]: [20],
	[BotTurnEffectType.ConfirmReady]: [7],
	[BotTurnEffectType.ConfirmEventually]: [6],
};

export function isEffectWeightOpsFromType(maybe: unknown): maybe is EffectWeightOpsFromType {
	const rec = maybe as Record<string, unknown>;
	return (maybe != null)
		&& (typeof maybe === "object")
		&& (!Array.isArray(maybe))
		&& (Object.keys(rec).findIndex(k => !isBotTurnEffectType(k) || !Array.isArray(rec[k])) < 0);
}

export function formatOrderedEffectWeightOpsFromType(weights: Partial<EffectWeightOpsFromType>): string {
	return (Object.keys(weights) as BotTurnEffectType[])
		.sort((a, b) => ((weights[b] as EffectWeightOp[])[0] as number) - ((weights[a] as EffectWeightOp[])[0] as number))
		.map(key => `${key}:${(weights[key] as EffectWeightOp[])[0]}`)
		.join(" > ");
}

export function formatEffectWeightOpsFromTypeDiff(
	after: Partial<EffectWeightOpsFromType>,
	before: Partial<EffectWeightOpsFromType>,
	showEqual = true,
): string {
	return BOT_TURN_EFFECT_TYPES
		.map((effectType: BotTurnEffectType): string | undefined => {
			const a = after[effectType];
			const b = before[effectType];
			if (a == null && b == null) {
				return undefined;  // `!${effectType}`;
			} else if (a == null && b != null) {
				return `-${effectType}:[${b?.join(",")}]`;
			} else if (b == null && a != null) {
				return `+${effectType}:[${a?.join(",")}]`;
			} else if (strictDeepEqual(a, b)) {
				return showEqual ? `=${effectType}:[${a?.join(",")}]` : undefined;
			} else {
				return `${effectType}:[${b?.join(",")}]=>[${a?.join(",")}]`;
			}
		})
		.filter(s => s != null)
		.join(" ");
}
