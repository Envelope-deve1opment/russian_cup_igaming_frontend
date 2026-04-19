<script lang="ts">
    import {RoomStatus} from "$lib/constants/roomStatus";
    import {onDestroy} from "svelte";
    import {get} from "svelte/store";
    import {page} from "$app/stores";
    import RoomLobby from "$lib/components/RoomLobby.svelte";
    import GameRound from "$lib/components/GameRound.svelte";
    import {currentRoomStore, setCurrentRoomId} from "$lib/stores/currentRoomStore";
    import {gameLogStore} from "$lib/stores/gameLogStore";
    import {roomsStore, updateRoom} from "$lib/stores/roomsStore";
    import {userStore} from "$lib/stores/userStore";

    let roomId = $derived($page.params.id ?? "");

    function ensureCurrentUserSeat(id: string): void {
        const r = get(roomsStore).find((x) => x.id === id);
        if (!r) return;
        if (r.participants.some((p) => p.isCurrentUser)) return;
        if (r.participants.length >= r.maxSeats) return;
        const u = get(userStore);
        updateRoom(id, {
            participants: [...r.participants, {id: u.id, name: u.name, isBot: false, isCurrentUser: true}]
        });
    }

    $effect(() => {
        const id = roomId;
        if (!id) {
            setCurrentRoomId(null);
            return;
        }
        setCurrentRoomId(id);
        queueMicrotask(() => ensureCurrentUserSeat(id));
    });

    onDestroy(() => {
        setCurrentRoomId(null);
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
