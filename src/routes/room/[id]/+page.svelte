<script lang="ts">
    import {RoomStatus} from "$lib/constants/roomStatus";
    import {onDestroy} from "svelte";
    import {get} from "svelte/store";
    import {page} from "$app/stores";
    import RoomLobby from "$lib/components/RoomLobby.svelte";
    import GameRound from "$lib/components/GameRound.svelte";
    import {currentRoomStore, setCurrentRoomId} from "$lib/stores/currentRoomStore";
    import {gameLogStore} from "$lib/stores/gameLogStore";
    import {roomsStore} from "$lib/stores/roomsStore";
    import {userStore} from "$lib/stores/userStore";
    import {roomParticipantService} from "$lib/api/roomParticipantService";
    import {refreshCurrentRoom, stopCurrentRoomRealtime, watchCurrentRoom} from "$lib/services/roomsRealtime";

    let roomId: string = $derived($page.params.id ?? "");

    async function ensureCurrentUserSeat(id: string): Promise<void> {
        const r = get(roomsStore).find((x) => x.id === id);
        if (!r) return;
        if (r.participants.some((p) => p.isCurrentUser)) return;
        if (r.participants.length >= r.maxSeats) return;
        const u = get(userStore);
        if (u.id === "guest") return;
        const occupied = new Set(
            r.participants
                .map((p) => p.seatNum)
                .filter((seatNum): seatNum is number => seatNum != null)
        );
        const firstFreeSeat = Array.from({length: r.maxSeats}, (_, i) => i).find((i) => !occupied.has(i));
        if (firstFreeSeat == null) return;
        await roomParticipantService.occupySeat(id, firstFreeSeat);
        await refreshCurrentRoom(id);
    }

    $effect(() => {
        const id = roomId;
        if (!id) {
            setCurrentRoomId(null);
            return;
        }
        setCurrentRoomId(id);
        void watchCurrentRoom(id);
        queueMicrotask(() => void ensureCurrentUserSeat(id));
    });

    onDestroy(() => {
        setCurrentRoomId(null);
        stopCurrentRoomRealtime();
    });

    let room = $derived($currentRoomStore);

    let latestResult = $derived.by(() => {
        if (!roomId) return null;
        return $gameLogStore.find((e) => e.roomId === roomId)?.result ?? null;
    });
</script>

{#if !roomId}
    <p class="state">Некорректная ссылка.</p>
{:else if !room}
    <p class="state">Комната не найдена или ещё загружается…</p>
{:else if room.status === RoomStatus.Finished && latestResult}
    <GameRound
            roomId={room.id}
            winnerID={latestResult.winnerID}
            participants={latestResult.participants}
            prizeAmount={latestResult.prizeAmount}
    />
{:else}
    <RoomLobby {room}/>
{/if}

<style lang="scss">
  @import "./+page.scss";
</style>
