<script lang="ts">
    import {SeatSlotState} from "$lib/constants/seatSlotState";
    import {onDestroy, onMount} from "svelte";
    import type {Participant, Room} from "$lib/types";
    import {purchaseBoost} from "$lib/stores/userStore";
    import {updateRoom} from "$lib/stores/roomsStore";

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
        return room.participants[index] ?? null;
    }

    function slotState(p: Participant | null): SeatSlotState {
        if (!p) return SeatSlotState.Free;
        if (p.isBot) return SeatSlotState.Bot;
        if (p.isCurrentUser) return SeatSlotState.You;
        return SeatSlotState.Human;
    }

    function buyBoost(): void {
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

        const ok: boolean = purchaseBoost(cost);
        if (!ok) {
            boostMessage = "Недостаточно бонусов";
            return;
        }

        const next = room.participants.map((p) =>
            p.id === currentUserParticipant?.id ? {...p, hasBoost: true} : p
        );

        updateRoom(room.id, {participants: next});
        boostMessage = "Буст куплен";
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
            <div class="seats" style:--cols={Math.min(room.maxSeats, 5)}>
                {#each Array(room.maxSeats) as _, i (i)}
                    {@const p = slotParticipant(i)}
                    <div class="seat" data-state={slotState(p)}>
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
                    </div>
                {/each}
            </div>

            <div class="boostRow">
                <button class="btn primary" disabled={!room.boostEnabled} onclick={buyBoost} type="button">
                    Купить буст
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
