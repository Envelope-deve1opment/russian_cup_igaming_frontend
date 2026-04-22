<script lang="ts">
    import {ROOM_STATUS_LABEL, type RoomStatus} from "$lib/constants/roomStatus";
    import {roomsStore} from "$lib/stores/roomsStore";
    import type {Room} from "$lib/types";
    import {lobbyService} from "$lib/api/lobbyService";

    let minPrice: number = $state(0);
    let maxPrice: number = $state(50_000);
    let minSeats: number = $state(2);
    let onlyBoost: boolean = $state(false);

    function matchesFilters(room: Room): boolean {
        if (room.entryPrice < minPrice || room.entryPrice > maxPrice) return false;
        if (room.maxSeats < minSeats) return false;

        return !(onlyBoost && !room.boostEnabled);
    }

    let filteredRooms: Room[] = $derived.by(() => {
        const list: Room[] = $roomsStore.filter(matchesFilters);

        return [...list].sort((a, b) => {
            const ta = a.timerEndsAt ?? Number.POSITIVE_INFINITY;
            const tb = b.timerEndsAt ?? Number.POSITIVE_INFINITY;
            return ta - tb;
        });
    });

    function formatEta(room: Room): string {
        const end: number | undefined = room.timerEndsAt;

        if (end == null) return "—";

        const s: number = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        const m: number = Math.floor(s / 60);
        const r: number = s % 60;

        return m > 0 ? `${m}м ${r}с` : `${r}с`;
    }

    function statusLabel(status: RoomStatus): string {
        return ROOM_STATUS_LABEL[status] ?? String(status);
    }
</script>


<div class="wrap">
    <header class="head">
        <h1 class="title">Лобби комнат</h1>
        <p class="sub">Быстрые столы на бонусные баллы. Обновления в реальном времени</p>
    </header>

    <section aria-label="Фильтры" class="filters">
        <label class="field">
            <span>Цена от</span>
            <input bind:value={minPrice} min="0" step="50" type="number"/>
        </label>
        <label class="field">
            <span>Цена до</span>
            <input bind:value={maxPrice} min="0" step="50" type="number"/>
        </label>
        <label class="field">
            <span>Мин. мест</span>
            <input bind:value={minSeats} max="10" min="2" step="1" type="number"/>
        </label>
        <label class="field toggle">
            <input bind:checked={onlyBoost} type="checkbox"/>
            <span>Только с бустом</span>
        </label>
    </section>

    {#if filteredRooms.length === 0}
        <p class="empty">Нет комнат под выбранные фильтры</p>
    {:else}
        <ul class="grid">
            {#each filteredRooms as room (room.id)}
                <li class="card">
                    <a class="cardLink" href="/room/{room.id}">
                        <div class="cardTop">
                            <h2 class="cardTitle">{room.name}</h2>
                            <span class="pill" data-status={room.status}>{statusLabel(room.status)}</span>
                        </div>
                        <dl class="stats">
                            <div>
                                <dt>Вход</dt>
                                <dd>{room.entryPrice.toLocaleString("ru-RU")}</dd>
                            </div>
                            <div>
                                <dt>Места</dt>
                                <dd>{room.seatsTaken}/{room.maxSeats}</dd>
                            </div>
                            <div>
                                <dt>Фонд</dt>
                                <dd>{room.prizeFund.toLocaleString("ru-RU")}</dd>
                            </div>
                            <div>
                                <dt>До старта</dt>
                                <dd class="eta">{formatEta(room)}</dd>
                            </div>
                        </dl>
                        <div class="cardFoot">
                            {#if room.boostEnabled}
                                <span class="boost">Буст · {room.boostCost?.toLocaleString("ru-RU") ?? "—"}</span>
                            {:else}
                                <span class="muted">Без буста</span>
                            {/if}
                        </div>
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>


<style lang="scss">
  @import "./RoomList.scss";
</style>
