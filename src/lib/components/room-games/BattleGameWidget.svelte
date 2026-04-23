<script lang="ts">
    import {onDestroy} from "svelte";
    import type {RoomGameSlot} from "./types";

    type EventState = {
        attackerId: string;
        targetId: string;
    } | null;

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

    let counts = $state<Record<string, number>>({});
    let currentEvent = $state<EventState>(null);
    let isRunning = $state(false);
    let completedWinnerId = $state<string | null>(null);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastStartSignal = -1;

    function stopLoop(): void {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function baseCount(slot: RoomGameSlot): number {
        return Math.max(4, Math.min(10, Math.round(slot.weight * 2) + 4));
    }

    function startBattle(): void {
        if (!winnerSlotId || isRunning) {
            return;
        }

        stopLoop();
        completedWinnerId = null;
        currentEvent = null;
        isRunning = true;
        counts = Object.fromEntries(slots.map((slot) => [slot.id, baseCount(slot) + (slot.id === winnerSlotId ? 2 : 0)]));

        intervalId = setInterval(() => {
            const alive = slots.filter((slot) => (counts[slot.id] ?? 0) > 0);
            const aliveLosers = alive.filter((slot) => slot.id !== winnerSlotId);

            if (aliveLosers.length === 0) {
                stopLoop();
                isRunning = false;
                completedWinnerId = winnerSlotId;
                currentEvent = null;
                onComplete?.();
                return;
            }

            const attacker = alive.find((slot) => slot.id === winnerSlotId) ?? alive[0];
            const target = aliveLosers[0];
            const damage = Math.min(counts[target.id], Math.max(1, Math.round(attacker.weight)));

            counts = {
                ...counts,
                [target.id]: Math.max(0, counts[target.id] - damage)
            };
            currentEvent = {
                attackerId: attacker.id,
                targetId: target.id
            };
        }, 520);
    }

    $effect(() => {
        if (startSignal <= 0 || startSignal === lastStartSignal) {
            return;
        }

        lastStartSignal = startSignal;
        startBattle();
    });

    onDestroy(() => {
        stopLoop();
    });
</script>

<div class="widget battle">
    {#each slots as slot (slot.id)}
        {@const activeAttack = currentEvent?.attackerId === slot.id}
        {@const activeTarget = currentEvent?.targetId === slot.id}
        <article
            class:attacking={activeAttack}
            class:targeted={activeTarget}
            class:winner={completedWinnerId === slot.id}
            class="card"
            style={`--slot-accent:${slot.accent}; --slot-soft:${slot.accentSoft};`}
        >
            <div class="cardTop">
                <span>Место {slot.place}</span>
                <strong>{counts[slot.id] ?? 0}</strong>
            </div>
            <h4>{slot.label}</h4>
            <div class="health">
                <span style={`width:${Math.max(0, Math.min(100, ((counts[slot.id] ?? 0) / Math.max(1, baseCount(slot) + (slot.id === winnerSlotId ? 2 : 0))) * 100))}%`}></span>
            </div>
        </article>
    {/each}
</div>

<style lang="scss">
  .widget.battle {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
    min-height: 320px;
    align-content: center;
  }

  .card {
    padding: 1rem;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--slot-accent) 32%, transparent);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--slot-accent) 14%, transparent), transparent 36%),
      linear-gradient(180deg, color-mix(in srgb, var(--slot-soft) 40%, rgba(16, 18, 25, 0.84)), rgba(16, 18, 25, 0.9));
    transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
  }

  .card.attacking {
    transform: translateY(-2px);
    box-shadow: 0 16px 28px color-mix(in srgb, var(--slot-accent) 16%, transparent);
  }

  .card.targeted {
    border-color: rgba(255, 122, 114, 0.6);
    box-shadow: inset 0 0 0 1px rgba(255, 122, 114, 0.2);
  }

  .card.winner {
    border-color: color-mix(in srgb, var(--slot-accent) 60%, white 10%);
    box-shadow: 0 18px 32px color-mix(in srgb, var(--slot-accent) 18%, transparent);
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
    margin: 0.75rem 0;
    font-size: 1rem;
    color: #fff;
  }

  .health {
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
  }

  .health span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--slot-accent), color-mix(in srgb, var(--slot-accent) 48%, white));
    transition: width 0.42s ease;
  }
</style>
