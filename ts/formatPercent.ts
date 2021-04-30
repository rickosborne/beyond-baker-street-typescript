import { roundTo } from "./roundTo";

export function formatPercent(value: number, decimals = 0): string {
    return `${roundTo(value * 100, decimals)}%`;
}
