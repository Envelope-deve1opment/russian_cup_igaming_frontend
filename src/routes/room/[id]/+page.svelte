<script lang="ts">
    import {goto} from "$app/navigation";
    import {onDestroy, tick} from "svelte";
    import {page} from "$app/stores";
    import RoomLobby from "$lib/components/RoomLobby.svelte";
    import GameRound from "$lib/components/GameRound.svelte";
    import RoomGameStage from "$lib/components/RoomGameStage.svelte";
    import {currentRoomStore, setCurrentRoomId} from "$lib/stores/currentRoomStore";
    import {gameLogStore} from "$lib/stores/gameLogStore";
    import {roomsStore} from "$lib/stores/roomsStore";
    import {roomService} from "$lib/api/roomService";
    import {lobbyStore} from "$lib/stores/lobbyStore";
    import {stopCurrentRoomRealtime, watchCurrentRoom} from "$lib/api/roomsRealtime";
    import {setAnimationPlaying} from "$lib/stores/gameAnimationStore";
    import {get} from "svelte/store";
    import type {Participant, RoundResult} from "$lib/types";
    import {RoomStatus} from "$lib/constants/roomStatusType";
    import type {RoomParticipantDto} from "$lib/api/dto";

    let routeId: string = $derived($page.params.id ?? "");
    let roomId: string = $state("");
    let resolvingRoom: boolean = $state(false);
    let resolveError: string = $state("");
    let animationCompletedKey: string | null = $state(null);
    let startedAnimationKey: string | null = $state(null);
    let stageRef: { start: () => void } | null = $state(null);

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
            void setCurrentRoomId(null);
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
                await setCurrentRoomId(resolvedRoomId);
                await watchCurrentRoom(resolvedRoomId);

                if (routeId === id && resolvedRoomId !== id) {
                    await goto(`/room/${resolvedRoomId}`, {replaceState: true});
                }
            } catch (error) {
                if (cancelled) return;

                roomId = id;
                await setCurrentRoomId(id);
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

    $effect(() => {
        roomId;
        animationCompletedKey = null;
        startedAnimationKey = null;
        stageRef = null;
    });

    onDestroy(async () => {
        await setCurrentRoomId(null);
        stopCurrentRoomRealtime();
    });

    let room = $derived($currentRoomStore);

    function resolveWinnerID(fallbackWinnerId: string | undefined, participants: RoomParticipantDto[]): string | null {
        if (!fallbackWinnerId) {
            return null;
        }

        const byParticipantId = participants.find((participant) => participant.id === fallbackWinnerId);
        if (byParticipantId) {
            return byParticipantId.id;
        }

        const byUserId = participants.find((participant) => participant.id === fallbackWinnerId);
        return byUserId?.id ?? fallbackWinnerId;
    }

    let latestResult = $derived.by<RoundResult | null>(() => {
        if (!roomId) return null;

        const logResult = $gameLogStore.find((entry) => entry.roomId === roomId)?.result ?? null;
        if (logResult) {
            console.log('latestResult from gameLogStore', logResult);
            return logResult;
        }

        if (room?.roundResult) {
            console.log('latestResult from room.roundResult', room.roundResult);
            return room.roundResult;
        }

        if (!room) {
            console.log('latestResult: no room');
            return null;
        }

        const winnerID = resolveWinnerID(room.winnerParticipantId, room.seats);
        if (!winnerID) {
            console.log('latestResult: no winnerID', {
                winnerParticipantId: room.winnerParticipantId,
                participants: room.seats.map(p => ({ id: p.id, name: p.username }))
            });
            return null;
        }

        console.log(room.seats)
        const result = {
            winnerID,
            prizeAmount: room.entryFee * room.participantsLimit,
            participants: room.seats
        };
        console.log('latestResult created from room data', result);
        return result;
    });

    let latestOutcomeKey = $derived.by(() => {
        if (!room || !latestResult) {
            return null;
        }

        const participantKey = latestResult.participants
            .map((participant) => `${participant.id}:${participant.weight ?? 1}`)
            .join("|");

        return `${room.id}:${room.gameType}:${room.countdownSeconds ?? "no-timer"}:${latestResult.winnerID}:${participantKey}:${latestResult.prizeAmount}`;
    });

    let shouldShowAnimation = $derived.by(() => {
        const result = !!room && !!latestResult && room.status === RoomStatus.FINISHED && latestOutcomeKey !== animationCompletedKey;
        console.log('shouldShowAnimation', {
            hasRoom: !!room,
            hasLatestResult: !!latestResult,
            latestOutcomeKey,
            animationCompletedKey,
            result,
            roomGameId: room?.gameType,
            latestResultWinnerID: latestResult?.winnerID
        });
        return result;
    });

    $effect(() => {
        setAnimationPlaying(shouldShowAnimation);
    });

    $effect(() => {
        if (!shouldShowAnimation || !latestOutcomeKey) {
            return;
        }

        if (startedAnimationKey === latestOutcomeKey) {
            return;
        }

        startedAnimationKey = latestOutcomeKey;
        animationCompletedKey = null;

        void tick().then(() => {
            stageRef?.start();
        });
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
{:else if latestResult}
    {console.log(4569999, latestResult)}
    <RoomGameStage
            bind:this={stageRef}
            participants={latestResult.participants}
            {room}
            winnerID={latestResult.winnerID}
            onComplete={() => {
                if (latestOutcomeKey) {
                    animationCompletedKey = latestOutcomeKey;
                }
            }}
    />
{:else if latestResult}
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
