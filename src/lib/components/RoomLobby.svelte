<script lang="ts">
    import {SeatSlotState} from "$lib/constants/seatSlotState";
    import {onDestroy, onMount} from "svelte";
    import type {Participant, Room} from "$lib/types";
    import {roomService} from "$lib/api/roomService";
    import {roomParticipantService} from "$lib/api/roomParticipantService";
    import {refreshCurrentRoom} from "$lib/services/roomsRealtime";

    let {room}: { room: Room } = $props();

    let now: number = $state(Date.now());
    let boostMessage: string | null = $state<string | null>(null);

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

    let currentUserParticipant = $derived(room.participants.find((p) => p.isCurrentUser));

    function slotParticipant(index: number): Participant | null {
        return room.participants.find((participant) => participant.seatNum === index) ?? null;
    }

    function slotState(p: Participant | null): SeatSlotState {
        if (!p) return SeatSlotState.Free;
        if (p.isBot) return SeatSlotState.Bot;
        if (p.isCurrentUser) return SeatSlotState.You;
        return SeatSlotState.Human;
    }

    function seatTitle(index: number): string {
        const seat = slotParticipant(index);
        if (!seat) {
            return "Нажмите, чтобы занять место";
        }
        if (seat.isCurrentUser) {
            return "Нажмите, чтобы освободить место";
        }
        return "Место занято другим участником";
    }

    async function buyBoost(): Promise<void> {
        boostMessage = null;

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
            await roomService.buyBoost(room.id);
            await refreshCurrentRoom(room.id);
            boostMessage = "Буст куплен";
        } catch {
            boostMessage = "Не удалось купить буст";
        }
    }

    async function toggleSeat(index: number): Promise<void> {
        const seat = slotParticipant(index);
        if (seat == null) {
            try {
                await roomParticipantService.occupySeat(room.id, index);
                await refreshCurrentRoom(room.id);
            } catch {
                boostMessage = "Не удалось занять место";
            }
            return;
        }
        if (!seat.isCurrentUser) {
            return;
        }
        try {
            await roomParticipantService.releaseSeat(room.id, index);
            await refreshCurrentRoom(room.id);
        } catch {
            boostMessage = "Не удалось освободить место";
        }
    }

    async function leaveRoom(): Promise<void> {
        try {
            await roomParticipantService.leaveRoom(room.id);
            await refreshCurrentRoom(room.id);
            boostMessage = "Вы вышли из комнаты";
        } catch {
            boostMessage = "Не удалось выйти из комнаты";
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
            <p class="msg" role="status">Свободное место можно занять кликом. Своё место можно освободить повторным
                кликом.</p>
            <div class="seats" style:--cols={Math.min(room.maxSeats, 5)}>
                {#each Array(room.maxSeats) as _, i (i)}
                    {@const p = slotParticipant(i)}
                    <button
                            aria-label={seatTitle(i)}
                            class="seat"
                            data-state={slotState(p)}
                            onclick={() => toggleSeat(i)}
                            title={seatTitle(i)}
                            type="button"
                    >
                        {#if p}
                            <span class="seatName">{p.name}</span>
                            {#if p.isBot}
                                <span class="botTag" title="Бот">AI</span>
                            {/if}
                            {#if p.hasBoost}
                                <span class="boostTag">BOOST</span>
                            {/if}
                        {:else}
                            <span class="free">Свободно</span>
                        {/if}
                    </button>
                {/each}
            </div>

            <div class="boostRow">
                <button class="btn primary" disabled={!room.boostEnabled} onclick={buyBoost} type="button">
                    Купить буст
                </button>
                <button class="btn" disabled={!currentUserParticipant} onclick={leaveRoom} type="button">
                    Покинуть комнату
                </button>
                {#if boostMessage}
                    <p class="msg" role="status">{boostMessage}</p>
                {/if}
            </div>
        </div>

        <div class="panel">
            <h2 class="h2">Участники</h2>
            <ul class="list">
                {#each room.participants as p (p.id)}
                    <li class="row">
                        <span class="name">{p.name}</span>
                        <span class="badges">
							{#if p.isBot}
								<span class="chip bot">Бот</span>
							{/if}
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
        </div>
    </div>
</section>

<style lang="scss">
  @import "./RoomLobby.scss";
</style>
