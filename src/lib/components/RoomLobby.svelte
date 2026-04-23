<script lang="ts">
    import {SeatSlotState} from "$lib/constants/seatSlotState";
    import {RoomStatus} from "$lib/constants/roomStatus";
    import {onDestroy, onMount} from "svelte";
    import type {Participant, Room} from "$lib/types";
    import {roomService} from "$lib/api/roomService";
    import {roomParticipantService} from "$lib/api/roomParticipantService";
    import {refreshCurrentRoom} from "$lib/services/roomsRealtime";

    let {room}: { room: Room } = $props();

    let now: number = $state(Date.now());
    let boostMessage: string | null = $state<string | null>(null);
    let pendingSeatIndex: number | null = $state<number | null>(null);
    let buyingBoost: boolean = $state(false);
    let leavingRoomPending: boolean = $state(false);

    const tickMs: number = 250;
    let handle: ReturnType<typeof setInterval> | null = null;

    onMount(() => {
        handle = setInterval(() => {
            now = Date.now();
        }, tickMs);
    });

    onDestroy(() => {
        if (handle) clearInterval(handle);
    });

    let secondsLeft = $derived(
        Math.max(0, Math.ceil(((room.timerEndsAt ?? now) - now) / 1000))
    );

    let canManageSeats = $derived(room.status === RoomStatus.Waiting || room.status === RoomStatus.Starting);
    let currentUserParticipant = $derived(room.participants.find((p) => p.isCurrentUser));

    function occupiedSeat(index: number): Participant | null {
        return room.participants.find((participant) => participant.seatNum === index) ?? null;
    }

    function visualSeat(index: number): Participant | null {
        return room.seatDecorations.find((participant) => participant.seatNum === index) ?? null;
    }

    function displayedSeat(index: number): Participant | null {
        return occupiedSeat(index) ?? visualSeat(index);
    }

    function slotState(index: number): SeatSlotState {
        const seat = occupiedSeat(index);
        if (!seat) {
            return visualSeat(index) ? SeatSlotState.Bot : SeatSlotState.Free;
        }
        if (seat.isCurrentUser) return SeatSlotState.You;
        return SeatSlotState.Human;
    }

    function seatTitle(index: number): string {
        const seat = occupiedSeat(index);
        if (!canManageSeats) {
            return "Рассадка закрыта для текущей стадии комнаты";
        }
        if (!seat) {
            if (visualSeat(index)) {
                return "Бот показан только как визуал. Нажмите, чтобы занять место";
            }
            return "Нажмите, чтобы занять место";
        }
        if (seat.isCurrentUser) {
            return "Нажмите, чтобы освободить место";
        }
        return "Место занято другим участником";
    }

    function seatDisabled(index: number): boolean {
        if (!canManageSeats || pendingSeatIndex != null) {
            return true;
        }

        const seat = occupiedSeat(index);
        return seat != null && !seat.isCurrentUser;
    }

    async function buyBoost(): Promise<void> {
        boostMessage = null;

        if (!canManageSeats) {
            boostMessage = "Буст недоступен после старта комнаты";
            return;
        }
        if (!room.boostEnabled) {
            boostMessage = "В этой комнате буст недоступен";
            return;
        }

        const cost: number | undefined = room.boostCost;
        if (cost == null) {
            boostMessage = "Стоимость буста не задана";
            return;
        }
        if (currentUserParticipant?.hasBoost) {
            boostMessage = "Буст уже активен";
            return;
        }
        if (!currentUserParticipant) {
            boostMessage = "Вы не заняли место за столом";
            return;
        }

        try {
            buyingBoost = true;
            await roomService.buyBoost(room.id);
            await refreshCurrentRoom(room.id);
            boostMessage = "Буст куплен";
        } catch {
            boostMessage = "Не удалось купить буст";
        } finally {
            buyingBoost = false;
        }
    }

    async function toggleSeat(index: number): Promise<void> {
        if (seatDisabled(index)) {
            return;
        }

        boostMessage = null;
        const seat = occupiedSeat(index);

        try {
            pendingSeatIndex = index;

            if (seat == null) {
                await roomParticipantService.occupySeat(room.id, index);
                await refreshCurrentRoom(room.id);
                return;
            }

            await roomParticipantService.releaseSeat(room.id, index);
            await refreshCurrentRoom(room.id);
        } catch {
            boostMessage = seat == null ? "Не удалось занять место" : "Не удалось освободить место";
        } finally {
            pendingSeatIndex = null;
        }
    }

    async function leaveRoom(): Promise<void> {
        boostMessage = null;

        if (!canManageSeats) {
            boostMessage = "Покинуть комнату можно только до старта раунда";
            return;
        }

        try {
            leavingRoomPending = true;
            await roomParticipantService.leaveRoom(room.id);
            await refreshCurrentRoom(room.id);
            boostMessage = "Вы вышли из комнаты";
        } catch {
            boostMessage = "Не удалось выйти из комнаты";
        } finally {
            leavingRoomPending = false;
        }
    }
</script>


<section aria-labelledby="lobby-title" class="lobby">
    <div class="top">
        <div>
            <h1 class="title" id="lobby-title">{room.name}</h1>
            <p class="meta">
                Вход <strong>{room.entryPrice.toLocaleString("ru-RU")}</strong> · Фонд
                <strong>{room.prizeFund.toLocaleString("ru-RU")}</strong>
            </p>
        </div>
        <div aria-live="polite" class="timer" role="timer">
            <span class="timerLabel">До события</span>
            <span class="timerValue">{secondsLeft}s</span>
        </div>
    </div>

    <div class="layout">
        <div class="panel">
            <h2 class="h2">Места за столом</h2>
            <p class="msg" role="status">
                Места игроков заняты по-настоящему. Слоты с AI — только визуал, их можно занимать.
            </p>
            <div class="seats" style:--cols={Math.min(room.maxSeats, 5)}>
                {#each Array(room.maxSeats) as _, i (i)}
                    {@const actualSeat = occupiedSeat(i)}
                    {@const shownSeat = displayedSeat(i)}
                    <button
                            aria-label={seatTitle(i)}
                            class="seat"
                            data-state={slotState(i)}
                            disabled={seatDisabled(i)}
                            onclick={() => toggleSeat(i)}
                            title={seatTitle(i)}
                            type="button"
                    >
                        {#if shownSeat}
                            <span class="seatName">{shownSeat.name}</span>
                            {#if shownSeat.isBot}
                                <span class="botTag" title="Бот">AI</span>
                            {/if}
                            {#if actualSeat?.hasBoost}
                                <span class="boostTag">BOOST</span>
                            {/if}
                            {#if shownSeat.isVisualOnly}
                                <span class="seatHint">Можно занять</span>
                            {/if}
                        {:else}
                            <span class="free">Свободно</span>
                        {/if}
                    </button>
                {/each}
            </div>

            <div class="boostRow">
                <button
                        class="btn primary"
                        disabled={!room.boostEnabled || !currentUserParticipant || !canManageSeats || buyingBoost}
                        onclick={buyBoost}
                        type="button"
                >
                    Купить буст
                </button>
                <button
                        class="btn"
                        disabled={!canManageSeats || leavingRoomPending}
                        onclick={leaveRoom}
                        type="button"
                >
                    Покинуть комнату
                </button>
                {#if boostMessage}
                    <p class="msg" role="status">{boostMessage}</p>
                {/if}
            </div>
        </div>

        <div class="panel">
            <h2 class="h2">Участники</h2>
            {#if room.participants.length === 0}
                <p class="msg">За столом пока нет реальных участников.</p>
            {:else}
                <ul class="list">
                    {#each room.participants as p (`${p.id}:${p.seatNum ?? "no-seat"}`)}
                        <li class="row">
                            <span class="name">{p.name}</span>
                            <span class="badges">
                                {#if p.isCurrentUser}
                                    <span class="chip you">Вы</span>
                                {/if}
                                {#if p.hasBoost}
                                    <span class="chip boost">Буст</span>
                                {/if}
                            </span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</section>

<style lang="scss">
  @import "./RoomLobby.scss";
</style>
