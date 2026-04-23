<script lang="ts">
    import {
        buildWheelGradient,
        buildWheelSegments,
        calculateWheelSpin,
        type WheelSegment,
        type WheelSlot
    } from "$lib/modules/wheel";
    import type {RoomGameSlot} from "./types";

    let {
        slots,
        winnerSlotId,
        startSignal = 0,
        onComplete
    }: {
        slots: RoomGameSlot[];
        winnerSlotId: string | null;
        startSignal?: number;
        onComplete?: () => void;
    } = $props();

    let rotation = $state(0);
    let spinDurationMs = $state(4000);
    let isSpinning = $state(false);
    let lastStartSignal = -1;

    const wheelSlots = $derived.by<WheelSlot[]>(() =>
        slots.map((slot) => ({
            value: slot.place,
            label: slot.label,
            accent: slot.accent,
            weight: Math.max(0.01, slot.weight)
        }))
    );
    const segments = $derived(buildWheelSegments(wheelSlots));
    const wheelGradient = $derived(buildWheelGradient(wheelSlots));
    const wheelStyle = $derived(
        `transform: rotate(${rotation}deg); background: ${wheelGradient}; transition-duration: ${spinDurationMs}ms;`
    );

    function labelStyle(segment: WheelSegment): string {
        const angle = segment.absoluteCenterAngle;
        return `transform: translate(-50%, -50%) rotate(${angle}deg) translateY(-220%) rotate(${-angle}deg);`;
    }

    function startSpin(): void {
        if (isSpinning || !winnerSlotId) {
            return;
        }

        const winner = slots.find((slot) => slot.id.includes(winnerSlotId));
        if (!winner) {
            return;
        }

        isSpinning = true;
        spinDurationMs = 4000;
        rotation = calculateWheelSpin(rotation, winner.place, 6, wheelSlots);
    }

    function handleTransitionEnd(): void {
        if (!isSpinning) {
            return;
        }

        isSpinning = false;
        onComplete?.();
    }

    $effect(() => {
        if (startSignal <= 0 || startSignal === lastStartSignal) {
            return;
        }

        lastStartSignal = startSignal;
        startSpin();
    });
</script>

<div class="widget wheel">
    <div aria-hidden="true" class="pointer"></div>
    <div class="wheelSurface" class:spinning={isSpinning} ontransitionend={handleTransitionEnd} style={wheelStyle}>
        {#each segments as segment (segment.slot.value)}
            <div class="segmentLabel" style={labelStyle(segment)}>
                <span>{segment.slot.label}</span>
            </div>
        {/each}
        <div class="hub">GO</div>
    </div>
</div>

<style lang="scss">
  .widget.wheel {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 360px;
  }

  .pointer {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-top: 24px solid var(--color-accent);
    z-index: 2;
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.24));
  }

  .wheelSurface {
    position: relative;
    width: min(100%, 320px);
    aspect-ratio: 1;
    border-radius: 50%;
    border: 10px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 26px 52px rgba(0, 0, 0, 0.28);
    transition-property: transform;
    transition-timing-function: cubic-bezier(.12, .84, .18, 1);
  }

  .segmentLabel {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-origin: center;
    width: 0;
  }

  .segmentLabel span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4.8rem;
    padding: 0.3rem 0.55rem;
    border-radius: 999px;
    background: rgba(10, 12, 18, 0.68);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 800;
    box-shadow: 0 10px 16px rgba(0, 0, 0, 0.18);
  }

  .hub {
    position: absolute;
    inset: 50%;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background: rgba(8, 12, 18, 0.92);
    color: var(--color-accent);
    font-weight: 900;
    letter-spacing: 0.12em;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
</style>
