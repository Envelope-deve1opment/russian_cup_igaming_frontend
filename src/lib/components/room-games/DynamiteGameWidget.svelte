<script lang="ts">
    import {onDestroy} from "svelte";
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

    type BombState = {
        holderId: string;
        targetId: string;
        tick: number;
    } | null;

    let counts = $state<Record<string, number>>({});
    let bombState = $state<BombState>(null);
    let explodedId = $state<string | null>(null);
    let completedWinnerId = $state<string | null>(null);
    let isRunning = $state(false);
    let lastStartSignal = -1;
    let timers: ReturnType<typeof setTimeout>[] = [];

    function clearTimers(): void {
        for (const timer of timers) {
            clearTimeout(timer);
        }
        timers = [];
    }

    function slotHealth(slot: RoomGameSlot): number {
        return Math.max(2, Math.min(5, Math.round(slot.weight * 1.6) + 1));
    }

    function aliveSlots(): RoomGameSlot[] {
        return [...slots].sort((left, right) => right.weight - left.weight || left.place - right.place);
    }

    function queue(delayMs: number, fn: () => void): void {
        timers.push(setTimeout(fn, delayMs));
    }

    function startMatch(): void {
        if (!winnerSlotId || isRunning) {
            console.log(7576767)
            return;
        }

        const winner = slots.find((slot) => slot.id.includes(winnerSlotId));
        if (!winner) {
            console.log(474356)
            return;
        }

        clearTimers();
        isRunning = true;
        explodedId = null;
        completedWinnerId = null;
        bombState = null;
        counts = Object.fromEntries(slots.map((slot) => [slot.id, slotHealth(slot)]));

        const losers = aliveSlots().filter((slot) => slot.id !== winnerSlotId);
        if (losers.length === 0) {
            queue(400, () => {
                isRunning = false;
                completedWinnerId = winnerSlotId;
                onComplete?.();
            });
            return;
        }

        losers.forEach((target, index) => {
            const holder = index % 2 === 0 ? winner : losers[Math.max(0, index - 1)];
            const launchAt = index * 820;
            const explodeAt = launchAt + 460;

            queue(launchAt, () => {
                explodedId = null;
                bombState = {
                    holderId: holder.id,
                    targetId: target.id,
                    tick: 3
                };
            });

            queue(launchAt + 170, () => {
                if (bombState?.targetId === target.id) {
                    bombState = {...bombState, tick: 2};
                }
            });

            queue(launchAt + 320, () => {
                if (bombState?.targetId === target.id) {
                    bombState = {...bombState, tick: 1};
                }
            });

            queue(explodeAt, () => {
                bombState = null;
                explodedId = target.id;
                counts = {
                    ...counts,
                    [target.id]: 0
                };
            });
        });

        queue(losers.length * 820 + 760, () => {
            explodedId = null;
            isRunning = false;
            completedWinnerId = winnerSlotId;
            onComplete?.();
        });
    }

    function slotsArray(slotId: string): number[] {
        const slot = slots.find((entry) => entry.id === slotId);
        if (!slot) {
            return [];
        }

        const total = slotHealth(slot);
        const current = counts[slotId] ?? total;
        return Array.from({length: total}, (_, index) => index < current ? 1 : 0);
    }

    $effect(() => {
        if (startSignal <= 0 || startSignal === lastStartSignal) {
            console.log(234234)
            return;
        }

        lastStartSignal = startSignal;
        startMatch();
    });

    onDestroy(() => {
        clearTimers();
    });
</script>

<div class="widget dynamite">
    {#each slots as slot (slot.id)}
        {@const aimed = bombState?.targetId === slot.id}
        {@const holding = bombState?.holderId === slot.id}
        {@const exploded = explodedId === slot.id}
        {@const winner = completedWinnerId === slot.id}
        <article
                class:aimed
                class:exploded
                class:holding
                class:winner
                class="card"
                style={`--slot-accent:${slot.accent}; --slot-soft:${slot.accentSoft};`}
        >
            <div class="cardTop">
                <span>Место {slot.place}</span>
                <strong>{counts[slot.id] ?? slotHealth(slot)}</strong>
            </div>
            <h4>{slot.label}</h4>

            <div class="slotRow">
                {#each slotsArray(slot.id) as alive, index (index)}
                    <span class:destroyed={!alive} class="slotCell"></span>
                {/each}
            </div>

            <div class="status">
                {#if bombState?.targetId === slot.id}
                    <span class="warning">T-{bombState.tick}</span>
                {:else if bombState?.holderId === slot.id}
                    <span>Передаёт заряд</span>
                {:else if winner}
                    <span>Выжил</span>
                {:else if (counts[slot.id] ?? 0) === 0}
                    <span>Выбит</span>
                {:else}
                    <span>Держится</span>
                {/if}
            </div>
        </article>
    {/each}
</div>

<style lang="scss">
  .widget.dynamite {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
    min-height: 320px;
    align-content: center;
  }

  .card {
    position: relative;
    padding: 1rem;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--slot-accent) 30%, transparent);
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--slot-accent) 14%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--slot-soft) 42%, rgba(16, 18, 25, 0.84)), rgba(16, 18, 25, 0.92));
    transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease, opacity 0.24s ease;
    overflow: hidden;
  }

  .card.holding {
    transform: translateY(-2px);
    box-shadow: 0 18px 30px color-mix(in srgb, var(--slot-accent) 16%, transparent);
  }

  .card.aimed {
    border-color: rgba(255, 172, 96, 0.72);
    box-shadow: inset 0 0 0 1px rgba(255, 172, 96, 0.26);
  }

  .card.exploded::after {
    content: "";
    position: absolute;
    inset: 15%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 193, 107, 0.64), rgba(255, 103, 72, 0.14) 48%, transparent 70%);
    animation: blast 0.48s ease-out forwards;
    pointer-events: none;
  }

  .card.winner {
    border-color: color-mix(in srgb, var(--slot-accent) 64%, white 10%);
    box-shadow: 0 18px 34px color-mix(in srgb, var(--slot-accent) 18%, transparent);
  }

  .cardTop {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    color: rgba(255, 255, 255, 0.68);
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .card h4 {
    margin: 0.75rem 0 0.9rem;
    font-size: 1rem;
    color: #fff;
  }

  .slotRow {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .slotCell {
    height: 1rem;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--slot-accent), color-mix(in srgb, var(--slot-accent) 44%, white));
    box-shadow: 0 6px 10px color-mix(in srgb, var(--slot-accent) 18%, transparent);
    transition: opacity 0.22s ease, transform 0.22s ease;
  }

  .slotCell.destroyed {
    opacity: 0.18;
    transform: scaleX(0.8);
    box-shadow: none;
  }

  .status {
    margin-top: 0.9rem;
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.76rem;
    letter-spacing: 0.04em;
  }

  .warning {
    color: #ffcb7a;
    font-weight: 800;
  }

  @keyframes blast {
    from {
      opacity: 0.92;
      transform: scale(0.2);
    }

    to {
      opacity: 0;
      transform: scale(1.35);
    }
  }
</style>
