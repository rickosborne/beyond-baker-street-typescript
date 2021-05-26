import { LossReason } from "../Game";
import { formatPercent } from "./formatPercent";

export function formatLossReasons(lossReasons: Partial<Record<LossReason, number>>, runCount: number): string {
	const reasons = Object.keys(lossReasons).sort() as LossReason[];
	if (reasons.length === 0) {
		return `none`;
	}
	// const runCount = sum(reasons.map(reason => lossReasons[reason] || 0));
	return reasons.map(reason => `${reason}=${lossReasons[reason]}=${formatPercent((lossReasons[reason] || 0) / runCount)}`).join(", ");
}
