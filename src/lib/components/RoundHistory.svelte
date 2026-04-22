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
</script>


<section aria-labelledby="hist-title" class="history">
    <header class="head">
        <h1 class="title" id="hist-title">Журнал раундов</h1>
        <label class="search">
            <span class="srOnly">Фильтр по победителю или комнате</span>
            <input
                    bind:value={query}
                    placeholder="Победитель, id или название комнаты…"
                    type="search"
            />
        </label>
    </header>

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
                    <td colspan="5" class="empty">Пока нет записей. Дождитесь завершения раунда в лобби</td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
</section>

<style lang="scss">
  @import "./RoundHistory.scss";
</style>
