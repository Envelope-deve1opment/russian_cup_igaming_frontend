<script lang="ts">
    import {goto} from "$app/navigation";
    import {APIError} from "$lib/api/baseAPI";
    import type {LobbyItemDto} from "$lib/api/dto";
    import {roomService} from "$lib/api/roomService";
    import {lobbyStore} from "$lib/stores/lobbyStore";

    let minPrice: number = $state(0);
    let maxPrice: number = $state(50_000);
    let minSeats: number = $state(2);
    let onlyBoost: boolean = $state(false);
    let pendingTemplateId: string | null = $state(null);
    let pendingMode: "manual" | "fast" | null = $state(null);
    let joinError: string = $state("");

    function matchesFilters(room: LobbyItemDto): boolean {
        if (room.entryFee < minPrice || room.entryFee > maxPrice) return false;
        if (room.participantsCount < minSeats) return false;

        return !(onlyBoost && !room.boostEnabled);
    }

    let filteredRooms: LobbyItemDto[] = $derived.by(() => {
        const list: LobbyItemDto[] = $lobbyStore.filter(matchesFilters);

        return [...list].sort((a, b) => {
            if (b.joinableRoomsCount !== a.joinableRoomsCount) {
                return b.joinableRoomsCount - a.joinableRoomsCount;
            }

            return a.templateName.localeCompare(b.templateName);
        });
    });

    const filteredOpenRooms = $derived(filteredRooms.reduce((total, room) => total + room.joinableRoomsCount, 0));
    const filteredBoostRooms = $derived(filteredRooms.filter((room) => room.boostEnabled).length);

    async function joinTemplate(templateId: string, mode: "manual" | "fast"): Promise<void> {
        if (pendingTemplateId != null) return;

        pendingTemplateId = templateId;
        pendingMode = mode;
        joinError = "";

        try {
            const room = mode === "fast"
                ? await roomService.fastJoin(templateId)
                : await roomService.manualJoin(templateId);
            await goto(`/room/${room.id}`);
        } catch (error) {
            joinError = error instanceof APIError
                ? error.message
                : mode === "fast"
                    ? "Не удалось подобрать быстрый матч"
                    : "Не удалось открыть комнату";
        } finally {
            pendingTemplateId = null;
            pendingMode = null;
        }
    }
</script>


<section class="wrap">
    <div class="toolbar">
        <div class="toolbarHead">
            <p class="eyebrow">Room selection</p>
            <h2 class="title">Доступные шаблоны</h2>
        </div>
        <div class="summary">
            <span class="summaryChip">Открытых: {filteredOpenRooms}</span>
            <span class="summaryChip">С бустом: {filteredBoostRooms}</span>
        </div>
    </div>

    <section aria-label="Фильтры" class="filters">
        <label class="field">
            <span>от</span>
            <input bind:value={minPrice} min="0" step="50" type="number"/>
        </label>
        <label class="field">
            <span>до</span>
            <input bind:value={maxPrice} min="0" step="50" type="number"/>
        </label>
        <label class="field">
            <span>места</span>
            <input bind:value={minSeats} max="10" min="2" step="1" type="number"/>
        </label>
        <label class="field toggle">
            <input bind:checked={onlyBoost} type="checkbox"/>
            <span>только буст</span>
        </label>
    </section>

    {#if joinError}
        <p class="feedback error">{joinError}</p>
    {/if}

    {#if filteredRooms.length === 0}
        <p class="feedback empty">Под эти фильтры сейчас нет столов.</p>
    {:else}
        <ul class="grid">
            {#each filteredRooms as room (room.templateId)}
                <li class="card">
                    <button
                            class="cardLink"
                            disabled={pendingTemplateId === room.templateId}
                            onclick={() => void joinTemplate(room.templateId, "manual")}
                            type="button"
                    >
                        <div class="cardTop">
                            <div>
                                <h3 class="cardTitle">{room.templateName}</h3>
                                <p class="cardSub">{room.joinableRoomsCount > 0 ? "Есть готовые столы" : "Ожидание мест"}</p>
                            </div>
                            <span class:closed={room.joinableRoomsCount === 0} class="pill">
                                {room.joinableRoomsCount > 0 ? "open" : "wait"}
                            </span>
                        </div>

                        <dl class="stats">
                            <div>
                                <dt>вход</dt>
                                <dd>{room.entryFee.toLocaleString("ru-RU")}</dd>
                            </div>
                            <div>
                                <dt>мест</dt>
                                <dd>{room.participantsCount}</dd>
                            </div>
                            <div>
                                <dt>фонд</dt>
                                <dd>{(room.entryFee * room.participantsCount).toLocaleString("ru-RU")}</dd>
                            </div>
                            <div>
                                <dt>столов</dt>
                                <dd>{room.activeRoomsCount}</dd>
                            </div>
                        </dl>

                        <div class="cardFoot">
                            <span class="meta">
                                {room.boostEnabled
                                    ? `Boost ${room.boostCost?.toLocaleString("ru-RU") ?? "—"}`
                                    : "Без буста"}
                            </span>
                            <span class="meta strong">Очередь {room.waitingPlayersCount}</span>
                        </div>
                    </button>

                    <div class="actions">
                        <button
                                class="actionBtn secondary"
                                disabled={pendingTemplateId === room.templateId}
                                onclick={() => void joinTemplate(room.templateId, "manual")}
                                type="button"
                        >
                            {pendingTemplateId === room.templateId && pendingMode === "manual" ? "Открываем..." : "Открыть"}
                        </button>
                        <button
                                class="actionBtn primary"
                                disabled={pendingTemplateId === room.templateId}
                                onclick={() => void joinTemplate(room.templateId, "fast")}
                                type="button"
                        >
                            {pendingTemplateId === room.templateId && pendingMode === "fast" ? "Ищем..." : "Fast join"}
                        </button>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</section>


<style lang="scss">
  @import "./RoomList.scss";
</style>
