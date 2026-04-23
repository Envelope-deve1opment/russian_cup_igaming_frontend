export type FlatRouletteColor = "amber" | "crimson" | "cyan";

export type FlatRouletteItem = {
    value: number;
    label: string;
    color: FlatRouletteColor;
};

export const FLAT_ROULETTE_VALUES: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];
export const FLAT_ROULETTE_INITIAL_INDEX = FLAT_ROULETTE_VALUES.length * 2;
export const FLAT_ROULETTE_TOTAL_CYCLES = 20;

const COLORS: FlatRouletteColor[] = ["amber", "crimson", "cyan"];

export function getFlatRouletteItems(): FlatRouletteItem[] {
    return FLAT_ROULETTE_VALUES.map((value, index) => ({
        value,
        label: `Место ${value}`,
        color: COLORS[index % COLORS.length]
    }));
}

export function buildFlatRouletteStrip(cycles: number = FLAT_ROULETTE_TOTAL_CYCLES): FlatRouletteItem[] {
    const base = getFlatRouletteItems();

    return Array.from({length: cycles}, () => base).flat();
}

export function getFlatRouletteIndex(value: number, items: FlatRouletteItem[] = getFlatRouletteItems()): number {
    const index = items.findIndex((item) => item.value === value);
    if (index === -1) {
        throw new Error(`Unknown flat roulette item: ${value}`);
    }
    return index;
}

export function calculateNextStopIndex(currentStopIndex: number, winnerValue: number, items: FlatRouletteItem[] = getFlatRouletteItems()): number {
    const itemsLength = items.length;
    const winnerIndex = getFlatRouletteIndex(winnerValue, items);
    const currentCycle = Math.floor(currentStopIndex / itemsLength);
    const nextCycle = currentCycle + 4;

    return nextCycle * itemsLength + winnerIndex;
}
