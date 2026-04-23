<script lang="ts">
    import RoomList from "$lib/components/RoomList.svelte";
    import {lobbyStore} from "$lib/stores/lobbyStore";

    const templatesCount = $derived($lobbyStore.length);
    const joinableRooms = $derived($lobbyStore.reduce((total, item) => total + item.joinableRoomsCount, 0));
    const waitingPlayers = $derived($lobbyStore.reduce((total, item) => total + item.waitingPlayersCount, 0));
    const averageEntry = $derived(
        $lobbyStore.length === 0
            ? 0
            : Math.round($lobbyStore.reduce((total, item) => total + item.entryFee, 0) / $lobbyStore.length)
    );
</script>


<div class="lobbyPage">
    <section class="heroCompact">
        <div class="heroLeft">
            <h1 class="heroTitle">Лобби <span class="heroAccent">{joinableRooms}</span></h1>
            <p class="heroSubtitle">{waitingPlayers} в очереди · средний вход {averageEntry.toLocaleString("ru-RU")}</p>
        </div>
        <div class="heroActions">
            <a class="heroLink" href="/history">
                <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16">
                    <path d="M3 3v18h18"/>
                    <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                История
            </a>
        </div>
    </section>

    <RoomList/>
</div>

<style lang="scss">
  @import "./+page.scss";
</style>
