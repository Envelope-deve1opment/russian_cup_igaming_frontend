<script lang="ts">
    import {gameLogStore} from "$lib/stores/gameLogStore";
    import type {Participant, RoundHistoryEntry} from "$lib/types";

    let query: string = $state("");

    function winnerName(entry: RoundHistoryEntry): string {
        const winner: Participant | undefined = entry.result.participants.find(
            (participant: Participant): boolean => participant.id === entry.result.winnerID
        );

        return winner?.name ?? entry.result.winnerID;
    }

    let rows = $derived.by(() => {
        const q: string = query.trim().toLowerCase();
        const list: RoundHistoryEntry[] = $gameLogStore;

        if (!q) return list;
        return list.filter((e) => {
            const w: string = winnerName(e).toLowerCase();
            return w.includes(q) || e.roomId.toLowerCase().includes(q) || e.roomName.toLowerCase().includes(q);
        });
    });

    const totalPrize = $derived(rows.reduce((total, entry) => total + entry.result.prizeAmount, 0));
</script>


<section aria-labelledby="hist-title" class="history">
    <header class="hero">
        <div class="heroCopy">
            <p class="eyebrow">Archive</p>
            <h1 class="title" id="hist-title">История завершённых розыгрышей</h1>
        </div>
        <div class="heroStats">
            <div class="stat">
                <span>Раундов</span>
                <strong>{rows.length}</strong>
            </div>
            <div class="stat">
                <span>Сумма призов</span>
                <strong>{totalPrize.toLocaleString("ru-RU")}</strong>
            </div>
        </div>
    </header>

    <div class="controls">
        <label class="search">
            <span class="srOnly">Фильтр по победителю или комнате</span>
            <input
                    bind:value={query}
                    placeholder="Победитель, id комнаты или название"
                    type="search"
            />
        </label>
    </div>

    <div class="tableWrap">
        <table class="table">
            <thead>
            <tr>
                <th scope="col">Время</th>
                <th scope="col">Комната</th>
                <th scope="col">Победитель</th>
                <th scope="col">Приз</th>
                <th scope="col">Игроки</th>
            </tr>
            </thead>
            <tbody>
            {#each rows as entry (entry.id)}
                <tr>
                    <td class="mono">{new Date(entry.finishedAt).toLocaleString("ru-RU")}</td>
                    <td>
                        <div class="room">{entry.roomName}</div>
                        <div class="muted mono">{entry.roomId}</div>
                    </td>
                    <td>{winnerName(entry)}</td>
                    <td class="mono">{entry.result.prizeAmount.toLocaleString("ru-RU")}</td>
                    <td class="mono">{entry.result.participants.length}</td>
                </tr>
            {:else}
                <tr>
                    <td colspan="5" class="empty">Пока нет завершённых раундов.</td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
</section>

<style lang="scss">
  @import "./RoundHistory.scss";
</style>
