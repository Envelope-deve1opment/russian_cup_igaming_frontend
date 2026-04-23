<script lang="ts">
    import {onDestroy, onMount} from "svelte";
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

    let viewportElement: HTMLDivElement | null = $state(null);
    let trackElement: HTMLDivElement | null = $state(null);
    let viewportWidth = $state(0);
    let resizeObserver: ResizeObserver | null = null;
    let trackOffset = $state(0);
    let transitionMs = $state(0);
    let stopIndex = $state(0);
    let isSpinning = $state(false);
    let lastStartSignal = -1;

    const stripItems = $derived.by(() =>
        Array.from({length: 18}, () => slots).flat()
    );
    const trackStyle = $derived(`transform: translateX(${trackOffset}px); transition-duration: ${transitionMs}ms;`);

    function getTileElement(index: number): HTMLDivElement | null {
        return trackElement?.querySelector(`[data-flat-index="${index}"]`) ?? null;
    }

    function syncOffset(animate: boolean = false): void {
        if (viewportWidth <= 0) {
            console.log(3333333333333333)
            return
        };
        const tile = getTileElement(stopIndex);
        if (!tile) return;

        transitionMs = animate ? transitionMs : 0;
        const center = tile.offsetLeft + tile.offsetWidth / 2;
        trackOffset = viewportWidth / 2 - center;
    }

    function updateViewportWidth(): void {
        viewportWidth = viewportElement?.clientWidth ?? 0;
        syncOffset(false);
    }

    function startSpin(): void {
        if (isSpinning || viewportWidth <= 0 || !winnerSlotId) {
            console.log(isSpinning, viewportWidth, !winnerSlotId)
            console.log(1111111111111111)
            return;
        }

        console.log(winnerSlotId, slots)
        const winnerIndex = slots.findIndex((slot) => slot.id.includes(winnerSlotId));
        if (winnerIndex === -1) {
            console.log(2222222222222222)
            return;
        }

        const itemsLength = slots.length;
        const currentCycle = Math.floor(stopIndex / itemsLength);
        const nextCycle = currentCycle + 4;

        isSpinning = true;
        transitionMs = 4200;
        stopIndex = nextCycle * itemsLength + winnerIndex;
        syncOffset(true);
    }

    function finishSpin(): void {
        if (!isSpinning) return;
        isSpinning = false;
        onComplete?.();
    }

    $effect(() => {
        if (isSpinning) {
            return;
        }

        stopIndex = slots.length * 2;
    });

    $effect(() => {
        if (startSignal <= 0 || startSignal === lastStartSignal) {
            return;
        }

        lastStartSignal = startSignal;
        startSpin();
    });

    onMount(() => {
        updateViewportWidth();

        if (viewportElement && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                updateViewportWidth();
            });
            resizeObserver.observe(viewportElement);
        }
    });

    onDestroy(() => {
        resizeObserver?.disconnect();
    });
</script>

<div class="widget roulette">
    <div bind:this={viewportElement} class="viewport">
        <div aria-hidden="true" class="centerGlow"></div>
        <div aria-hidden="true" class="marker"></div>
        <div bind:this={trackElement} class="track" ontransitionend={finishSpin} style={trackStyle}>
            {#each stripItems as slot, index (`${slot.id}-${index}`)}
                <div class="tile" data-flat-index={index}
                     style={`--slot-accent:${slot.accent}; --slot-soft:${slot.accentSoft};`}>
                    <small>Место {slot.place}</small>
                    <strong>{slot.label}</strong>
                </div>
            {/each}
        </div>
    </div>
</div>

<style lang="scss">
  .widget.roulette {
    min-height: 240px;
    padding: 2rem 0;
    display: grid;
    align-content: center;
  }

  .viewport {
    position: relative;
    overflow: hidden;
    min-height: 280px;
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.08));
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .centerGlow,
  .marker {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 2;
  }

  .centerGlow {
    inset: 0 auto 0 50%;
    width: 8rem;
    background: radial-gradient(circle, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 72%);
  }

  .marker {
    top: 0.8rem;
    width: 0;
    height: calc(100% - 1.6rem);
    border-left: 2px solid var(--color-accent);
    box-shadow: 0 0 22px color-mix(in srgb, var(--color-accent) 40%, transparent);
  }

  .track {
    display: inline-flex;
    align-items: stretch;
    gap: 0.7rem;
    padding: 0 1rem;
    height: 100%;
    transition-property: transform;
    transition-timing-function: cubic-bezier(.11, .84, .17, 1);
    will-change: transform;
  }

  .tile {
    width: 170px;
    min-height: 180px;
    padding: 1rem 0.9rem;
    border-radius: 26px;
    border: 1px solid color-mix(in srgb, var(--slot-accent) 35%, transparent);
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--slot-accent) 18%, transparent), transparent 35%),
    linear-gradient(180deg, color-mix(in srgb, var(--slot-soft) 55%, rgba(16, 18, 25, 0.82)), rgba(16, 18, 25, 0.9));
    display: grid;
    align-content: end;
    gap: 0.35rem;
    box-shadow: 0 14px 24px rgba(0, 0, 0, 0.18);
  }

  .tile small {
    color: rgba(255, 255, 255, 0.62);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .tile strong {
    font-size: 1.05rem;
    color: #fff;
  }
</style>
