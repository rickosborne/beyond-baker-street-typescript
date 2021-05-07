import { BOT_TURN_EFFECT_TYPES, BotTurnEffectType, isBotTurnEffectType } from "./BotTurn";
import { EffectWeightOp, EffectWeightOperand, EffectWeightOperator } from "./EffectWeight";
import { strictDeepEqual } from "./strictDeepEqual";

export type EffectWeightOpsFromType = Record<BotTurnEffectType, EffectWeightOp[]>;

const HOLMES_MAX = 20;
export const DEFAULT_SCORE_FROM_TYPE: EffectWeightOpsFromType = {
	[BotTurnEffectType.Win]: [1000],
	[BotTurnEffectType.InvestigatePerfect]: [100],
	[BotTurnEffectType.PursueImpossible]: [50],
	[BotTurnEffectType.AssistExactEliminate]: [40],
	[BotTurnEffectType.PursueDuplicate]: [ 35, EffectWeightOperand.EvidenceTarget, EffectWeightOperator.Add ],
	[BotTurnEffectType.EliminateKnownUnusedValue]: [ 30, EffectWeightOperand.EvidenceValue, EffectWeightOperand.EvidenceValueMax, EffectWeightOperator.Add, EffectWeightOperand.EvidenceValueMax, 2, EffectWeightOperator.Multiply, EffectWeightOperator.Divide, EffectWeightOperator.Multiply ],
	[BotTurnEffectType.EliminateUnusedType]: [ 25, EffectWeightOperand.Probability4Plus, EffectWeightOperator.Multiply ],
	[BotTurnEffectType.AssistKnown]: [ 20, 20, EffectWeightOperand.AssistRatio, EffectWeightOperator.Reverse, EffectWeightOperator.Multiply, EffectWeightOperator.Subtract ],
	[BotTurnEffectType.InvestigateCorrectType]: [12],
	[BotTurnEffectType.EliminateSetsUpExact]: [10],
	[BotTurnEffectType.Confirm]: [8],
	[BotTurnEffectType.HolmesImpeded]: [8],
	[BotTurnEffectType.AssistImpossibleType]: [ 5, 5, EffectWeightOperand.AssistRatio, EffectWeightOperator.Reverse, EffectWeightOperator.Multiply, EffectWeightOperator.Subtract ],
	[BotTurnEffectType.AssistNarrow]: [ 3, 3, EffectWeightOperand.AssistRatio, EffectWeightOperator.Reverse, EffectWeightOperator.Multiply, EffectWeightOperator.Subtract ],
	[BotTurnEffectType.AssistNextPlayer]: [1],

	[BotTurnEffectType.InvestigateCorrectValue]: [0],

	[BotTurnEffectType.ImpossibleAdded]: [ 0, EffectWeightOperand.ImpossibleCount, EffectWeightOperator.Subtract ],
	[BotTurnEffectType.EliminateUnknownValue]: [-5],
	[BotTurnEffectType.HolmesProgress]: [ -HOLMES_MAX, EffectWeightOperand.HolmesLocation, EffectWeightOperator.Add ],
	[BotTurnEffectType.InvestigateMaybeBad]: [-10],
	[BotTurnEffectType.InvestigateWild]: [-12],
	[BotTurnEffectType.InvestigateBad]: [-15],
	[BotTurnEffectType.EliminateUsedType]: [-20],
	[BotTurnEffectType.PursueMaybe]: [-25],
	[BotTurnEffectType.EliminateKnownUsedValue]: [-30],
	[BotTurnEffectType.EliminateStompsExact]: [-40],
	[BotTurnEffectType.EliminateWild]: [-50],
	[BotTurnEffectType.MaybeLose]: [-60],
	[BotTurnEffectType.PursuePossible]: [-100],
	[BotTurnEffectType.Lose]: [-1000],
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
