<script lang="ts">
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

    let progress = $state<Record<string, number>>({});
    let isRunning = $state(false);
    let completedWinnerId = $state<string | null>(null);
    let lastStartSignal = -1;
    let finishTimeout: ReturnType<typeof setTimeout> | null = null;

    function clearFinishTimeout(): void {
        if (finishTimeout) {
            clearTimeout(finishTimeout);
            finishTimeout = null;
        }
    }

    function getTargetProgress(slot: RoomGameSlot, index: number): number {
        if (slot.id === winnerSlotId) {
            return 100;
        }

        const penalty = index * 2 + Math.max(0, 1 - slot.weight) * 8;
        return Math.max(62, 100 - penalty);
    }

    function startRace(): void {
        if (!winnerSlotId || isRunning) {
            return;
        }

        clearFinishTimeout();
        completedWinnerId = null;
        isRunning = true;

        progress = Object.fromEntries(slots.map((slot) => [slot.id, 0]));

        requestAnimationFrame(() => {
            progress = Object.fromEntries(slots.map((slot, index) => [slot.id, getTargetProgress(slot, index)]));
        });

        finishTimeout = setTimeout(() => {
            isRunning = false;
            completedWinnerId = winnerSlotId;
            onComplete?.();
        }, 4300);
    }

    $effect(() => {
        if (startSignal <= 0 || startSignal === lastStartSignal) {
            return;
        }

        lastStartSignal = startSignal;
        startRace();
    });
</script>

<div class="widget race">
    {#each slots as slot (slot.id)}
        <div class:winner={completedWinnerId === slot.id} class="lane"
             style={`--slot-accent:${slot.accent}; --slot-soft:${slot.accentSoft};`}>
            <div class="laneMeta">
                <strong>{slot.label}</strong>
                <span>{slot.place}</span>
            </div>
            <div class="track">
                <div class="finishLine"></div>
                <div class="progressWrap">
                    <div class="progress" style={`width:${progress[slot.id] ?? 0}%;`}>
                        <span class="car">{slot.place}</span>
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
  .widget.race {
    display: grid;
    gap: 0.8rem;
    min-height: 320px;
    align-content: center;
  }

  .lane {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 0.8rem;
    align-items: center;
  }

  .laneMeta {
    display: grid;
    gap: 0.15rem;
  }

  .laneMeta strong {
    font-size: 0.9rem;
  }

  .laneMeta span {
    color: var(--color-text-muted);
    font-size: 0.76rem;
  }

  .track {
    position: relative;
    min-height: 56px;
    padding: 0.35rem 0.4rem;
    border-radius: 18px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.08));
    overflow: hidden;
  }

  .finishLine {
    position: absolute;
    right: 1rem;
    inset-block: 0.4rem;
    width: 6px;
    background: repeating-linear-gradient(180deg, #fff 0 8px, rgba(0, 0, 0, 0.12) 8px 16px);
    border-radius: 999px;
  }

  .progressWrap {
    position: relative;
    height: 100%;
  }

  .progress {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-radius: 14px;
    background: linear-gradient(90deg, var(--slot-soft), color-mix(in srgb, var(--slot-accent) 25%, transparent));
    transition: width 4.2s cubic-bezier(.16, .82, .22, 1);
  }

  .car {
    display: grid;
    place-items: center;
    width: 2.2rem;
    height: 2.2rem;
    margin-right: 0.15rem;
    border-radius: 12px;
    background: var(--slot-accent);
    color: rgba(10, 10, 14, 0.92);
    font-size: 0.82rem;
    font-weight: 900;
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.18);
  }

  .lane.winner .car {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--slot-accent) 38%, white), 0 12px 22px color-mix(in srgb, var(--slot-accent) 24%, transparent);
  }
</style>
