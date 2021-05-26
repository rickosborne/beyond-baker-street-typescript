import { roundTo } from "../util/roundTo";

export function formatPercent(value: number, decimals = 0): string {
    return `${roundTo(value * 100, decimals)}%`;
}
