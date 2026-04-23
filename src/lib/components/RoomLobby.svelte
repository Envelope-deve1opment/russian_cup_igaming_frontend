<script lang="ts">
    import {goto} from "$app/navigation";
    import {SeatSlotState} from "$lib/constants/seatSlotState";
    import {RoomStatus} from "$lib/constants";
    import {onDestroy, onMount} from "svelte";
    import type {Participant, Room} from "$lib/types";
    import {roomService} from "$lib/api/roomService";
    import {roomParticipantService} from "$lib/api/roomParticipantService";
    import {refreshCurrentRoom, stopCurrentRoomRealtime} from "$lib/api/roomsRealtime";
    import {refreshBalance} from "$lib/api/balanceService";
    import {setCurrentRoomId} from "$lib/stores/currentRoomStore";
    import type {RoomDetailsDto, RoomParticipantDto} from "$lib/api/dto";
    import {userStore} from "$lib/stores/userStore";

    let {room}: { room: RoomDetailsDto } = $props();

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

    let secondsLeft = $derived.by(() => {
        if (room.timerEndsAt == null) return null;
        const remaining = Math.ceil((room.timerEndsAt - now) / 1000);
        return Math.max(0, remaining);
    });
    let hasCountdown = $derived(room.timerEndsAt != null);

    let canManageSeats = $derived(
        room.status === RoomStatus.WAITING || room.status === RoomStatus.STARTING || room.status === RoomStatus.COUNTDOWN
    );
    let currentUserParticipant = $derived(room.seats.find(isCurrentUser));

    function isCurrentUser(seat: RoomParticipantDto): boolean {
        return seat.username == $userStore.name;
    }

    function occupiedSeat(index: number): RoomParticipantDto | null {
        return room.seats.find((participant) => participant.seatNum === index) ?? null;
    }

    function visualSeat(index: number): RoomParticipantDto | null {
        return room.seats.find((participant) => participant.seatNum === index) ?? null;
    }

    function displayedSeat(index: number): RoomParticipantDto | null {
        return occupiedSeat(index) ?? visualSeat(index);
    }

    function slotState(index: number): SeatSlotState {
        const seat = occupiedSeat(index);
        if (!seat) {
            return visualSeat(index) ? SeatSlotState.Bot : SeatSlotState.Free;
        }
        if (isCurrentUser(seat)) return SeatSlotState.You;
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
        if (isCurrentUser(seat)) {
            return "Нажмите, чтобы освободить место";
        }
        return "Место занято другим участником";
    }

    function seatDisabled(index: number): boolean {
        if (!canManageSeats || pendingSeatIndex != null) {
            return true;
        }

        const seat = occupiedSeat(index);

        if (seat?.bot) {
            return false;
        }

        return seat != null && !isCurrentUser(seat);
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
            await refreshBalance();
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

            if (seat == null || seat.bot) {
                await roomParticipantService.occupySeat(room.id, index);
                await refreshCurrentRoom(room.id);
                await refreshBalance();
                return;
            }

            await roomParticipantService.releaseSeat(room.id, index);
            await refreshCurrentRoom(room.id);
            await refreshBalance();
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
            await refreshBalance();
            boostMessage = "Вы вышли из комнаты";
            await setCurrentRoomId(null);
            stopCurrentRoomRealtime();
            await goto("/lobby");
        } catch {
            boostMessage = "Не удалось выйти из комнаты";
        } finally {
            leavingRoomPending = false;
        }
    }

    async function sellSeat(): Promise<void> {
        boostMessage = null;

        if (!canManageSeats) {
            boostMessage = "Вернуть билет можно только до старта раунда";
            return;
        }

        if (!currentUserParticipant || currentUserParticipant.seatNum == null) {
            boostMessage = "У вас нет занятого места";
            return;
        }

        try {
            leavingRoomPending = true;
            await roomParticipantService.releaseSeat(room.id, currentUserParticipant.seatNum);
            await refreshCurrentRoom(room.id);
            await refreshBalance();
            boostMessage = `Билет возвращён. +${room.entryFee.toLocaleString("ru-RU")}`;
        } catch {
            boostMessage = "Не удалось вернуть билет";
        } finally {
            leavingRoomPending = false;
        }
    }
</script>


<section aria-labelledby="lobby-title" class="lobby">
    <div class="top">
        <div>
            <h1 class="title" id="lobby-title">{room.templateName}</h1>
            <p class="meta">
                Вход <strong>{room.entryFee.toLocaleString("ru-RU")}</strong> · Фонд
                <strong>{(room.entryFee * room.participantsLimit).toLocaleString("ru-RU")}</strong> · Комиссия
                <strong>
                    {room.commission ?? 0}%</strong> · Мест <strong>{room.seats.filter((s) => !s.bot).length}/{room.participantsLimit}
            </strong>
            </p>
        </div>
        {#if hasCountdown && secondsLeft != null}
            <div aria-live="polite" class="timer" role="timer">
                <span class="timerLabel">До события</span>
                <span class="timerValue">{secondsLeft}с</span>
            </div>
        {/if}
    </div>

    <div class="layout">
        <div class="panel">
            <h2 class="h2">Места за столом</h2>
            <p class="msg" role="status">
                Слоты с AI декоративные. Реально заняты только места живых игроков
            </p>
            <div class="seats" style:--cols={Math.min(room.participantsLimit, 5)}>
                {#each Array(room.participantsLimit) as _, i (i)}
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
                            <span class="seatName">{shownSeat.username}</span>
                            {#if shownSeat.bot}
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
                        disabled={!canManageSeats || !currentUserParticipant || leavingRoomPending}
                        onclick={sellSeat}
                        type="button"
                >
                    Вернуть билет (+{room.entryFee.toLocaleString("ru-RU")})
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
            {#if room.seats.length === 0}
                <p class="msg">Стол свободен. Первый игрок задаёт темп комнаты</p>
            {:else}
                <ul class="list">
                    {#each room.seats as p (`${p.id}:${p.seatNum ?? "no-seat"}`)}
                        <li class="row">
                            <span class="name">{p.username}</span>
                            <span class="badges">
                                {#if isCurrentUser(p)}
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
