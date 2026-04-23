export const WHEEL_MIN_SLOT = 2;
export const WHEEL_MAX_SLOT = 10;
export const MIN_WHEEL_WEIGHT = 0.01;
export const WHEEL_START_ANGLE = 0;

export type WheelSlot = {
    value: number;
    label: string;
    accent: string;
    weight: number;
};

export type WheelSegment = {
    slot: WheelSlot;
    startAngle: number;
    endAngle: number;
    centerAngle: number;
    absoluteCenterAngle: number;
    sweepAngle: number;
    normalizedWeight: number;
};

export function clampWheelWeight(weight: number): number {
    if (!Number.isFinite(weight)) {
        return 1;
    }
    return Math.max(MIN_WHEEL_WEIGHT, weight);
}

export function createWheelSlots(min: number = WHEEL_MIN_SLOT, max: number = WHEEL_MAX_SLOT): WheelSlot[] {
    return Array.from({length: max - min + 1}, (_, index) => {
        const value = min + index;
        const hue = 12 + index * 31;

        return {
            value,
            label: String(value),
            accent: `hsl(${hue}deg 86% 62%)`,
            weight: 1
        };
    });
}

export const DEFAULT_WHEEL_SLOTS: WheelSlot[] = createWheelSlots();

export function normalizeRotation(rotation: number): number {
    return ((rotation % 360) + 360) % 360;
}

export function createWeightedSlots(weights: number[], baseSlots: WheelSlot[] = DEFAULT_WHEEL_SLOTS): WheelSlot[] {
    return baseSlots.map((slot, index) => ({
        ...slot,
        weight: clampWheelWeight(weights[index] ?? slot.weight)
    }));
}

export function buildWheelSegments(slots: WheelSlot[] = DEFAULT_WHEEL_SLOTS): WheelSegment[] {
    const normalizedSlots = slots.map((slot) => ({...slot, weight: clampWheelWeight(slot.weight)}));
    const totalWeight = normalizedSlots.reduce((sum, slot) => sum + slot.weight, 0);
    let cursor = 0;

    return normalizedSlots.map((slot) => {
        const normalizedWeight = slot.weight / totalWeight;
        const sweepAngle = normalizedWeight * 360;
        const startAngle = cursor;
        const endAngle = cursor + sweepAngle;
        const centerAngle = startAngle + sweepAngle / 2;
        const absoluteCenterAngle = WHEEL_START_ANGLE + centerAngle;
        cursor = endAngle;

        return {
            slot,
            startAngle,
            endAngle,
            centerAngle,
            absoluteCenterAngle,
            sweepAngle,
            normalizedWeight
        };
    });
}

export function getWheelSegment(targetValue: number, slots: WheelSlot[] = DEFAULT_WHEEL_SLOTS): WheelSegment {
    const segment = buildWheelSegments(slots).find((item) => item.slot.value === targetValue);
    if (!segment) {
        throw new Error(`Unknown wheel slot: ${targetValue}`);
    }
    return segment;
}

export function getTargetRotation(targetValue: number, slots: WheelSlot[] = DEFAULT_WHEEL_SLOTS): number {
    const segment = getWheelSegment(targetValue, slots);
    return normalizeRotation(-segment.absoluteCenterAngle);
}

export function calculateWheelSpin(
    currentRotation: number,
    targetValue: number,
    turns: number = 6,
    slots: WheelSlot[] = DEFAULT_WHEEL_SLOTS
): number {
    const currentNormalized = normalizeRotation(currentRotation);
    const targetRotation = getTargetRotation(targetValue, slots);
    const delta = normalizeRotation(targetRotation - currentNormalized);

    return currentRotation + turns * 360 + delta;
}

export function buildWheelGradient(slots: WheelSlot[] = DEFAULT_WHEEL_SLOTS): string {
    const segments = buildWheelSegments(slots);

    return `conic-gradient(from ${WHEEL_START_ANGLE}deg, ${segments
        .map((segment) => `${segment.slot.accent} ${segment.startAngle}deg ${segment.endAngle}deg`)
        .join(", ")})`;
}
