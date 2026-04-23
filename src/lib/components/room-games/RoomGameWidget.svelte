<script lang="ts">
    import type {RoomGameId} from "$lib/constants/roomGame";
    import BattleGameWidget from "./BattleGameWidget.svelte";
    import DynamiteGameWidget from "./DynamiteGameWidget.svelte";
    import RaceGameWidget from "./RaceGameWidget.svelte";
    import RouletteGameWidget from "./RouletteGameWidget.svelte";
    import type {RoomGameSlot} from "./types";
    import WheelGameWidget from "./WheelGameWidget.svelte";

    let {
        gameId,
        slots,
        winnerSlotId,
        onComplete
    }: {
        gameId: RoomGameId;
        slots: RoomGameSlot[];
        winnerSlotId: string | null;
        onComplete?: () => void;
    } = $props();

    let startSignal = $state(0);

    export function start(): void {
        startSignal += 1;
    }
</script>

{#if gameId === "WHEEL"}
    <WheelGameWidget {slots} {winnerSlotId} {startSignal} {onComplete}/>
{:else if gameId === "ROULETTE"}
    <RouletteGameWidget {slots} {winnerSlotId} {startSignal} {onComplete}/>
{:else if gameId === "RACE"}
    <RaceGameWidget {slots} {winnerSlotId} {startSignal} {onComplete}/>
{:else if gameId === "BATTLE"}
    <BattleGameWidget {slots} {winnerSlotId} {startSignal} {onComplete}/>
{:else}
    <DynamiteGameWidget {slots} {winnerSlotId} {startSignal} {onComplete}/>
{/if}
