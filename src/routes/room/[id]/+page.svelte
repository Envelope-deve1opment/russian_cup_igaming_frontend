<script lang="ts">
    import {goto} from "$app/navigation";
    import {RoomStatus} from "$lib/constants/roomStatus";
    import {onDestroy} from "svelte";
    import {page} from "$app/stores";
    import RoomLobby from "$lib/components/RoomLobby.svelte";
    import GameRound from "$lib/components/GameRound.svelte";
    import {currentRoomStore, setCurrentRoomId} from "$lib/stores/currentRoomStore";
    import {gameLogStore} from "$lib/stores/gameLogStore";
    import {roomsStore} from "$lib/stores/roomsStore";
    import {roomService} from "$lib/api/roomService";
    import {lobbyStore} from "$lib/stores/lobbyStore";
    import {stopCurrentRoomRealtime, watchCurrentRoom} from "$lib/services/roomsRealtime";
    import {get} from "svelte/store";

    let routeId: string = $derived($page.params.id ?? "");
    let roomId: string = $state("");
    let resolvingRoom: boolean = $state(false);
    let resolveError: string = $state("");

    async function resolveRoomId(id: string): Promise<string> {
        const existingRoom = get(roomsStore).find((room) => room.id === id);
        if (existingRoom) {
            return id;
        }

        const knownRoom = get(lobbyStore).some((item) => item.templateId === id);
        if (!knownRoom) {
            return id;
        }

        const room = await roomService.manualJoin(id);
        return room.id;
    }

    $effect(() => {
        const id = routeId;

        if (!id) {
            roomId = "";
            resolveError = "";
            resolvingRoom = false;
            setCurrentRoomId(null);
            return;
        }

        let cancelled = false;
        resolvingRoom = true;
        resolveError = "";

        void (async () => {
            try {
                const resolvedRoomId = await resolveRoomId(id);
                if (cancelled) return;

                roomId = resolvedRoomId;
                setCurrentRoomId(resolvedRoomId);
                await watchCurrentRoom(resolvedRoomId);

                if (routeId === id && resolvedRoomId !== id) {
                    await goto(`/room/${resolvedRoomId}`, {replaceState: true});
                }
            } catch (error) {
                if (cancelled) return;

                roomId = id;
                setCurrentRoomId(id);
                resolveError = error instanceof Error ? error.message : "Не удалось открыть комнату.";
            } finally {
                if (!cancelled) {
                    resolvingRoom = false;
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    });

    onDestroy(() => {
        setCurrentRoomId(null);
        stopCurrentRoomRealtime();
    });

    let room = $derived($currentRoomStore);

    let latestResult = $derived.by(() => {
        if (!roomId) return null;
        return $gameLogStore.find((e) => e.roomId === roomId)?.result ?? room?.roundResult ?? null;
    });
</script>

{#if !roomId}
    <p class="state">Некорректная ссылка.</p>
{:else if resolveError}
    <p class="state">{resolveError}</p>
{:else if resolvingRoom}
    <p class="state">Подключаем к комнате…</p>
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
