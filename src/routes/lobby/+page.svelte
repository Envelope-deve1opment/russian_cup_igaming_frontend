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
    <section class="heroPanel">
        <div class="heroCopy">
            <p class="eyebrow">Realtime lobby</p>
            <h1 class="heroTitle">Живые комнаты для быстрого входа и точного контроля темпа.</h1>
            <p class="heroText">
                Выбирайте стол вручную или отдавайте подбор системе. Всё обновляется на лету, без перегрузки интерфейса.
            </p>
            <div class="heroActions">
                <a class="cta primary" href="/wheel">Открыть модуль выбора</a>
                <a class="cta secondary" href="/history">История раундов</a>
            </div>
        </div>

        <div class="heroMetrics">
            <div class="metricCard">
                <span class="metricLabel">Шаблоны</span>
                <strong class="metricValue">{templatesCount}</strong>
            </div>
            <div class="metricCard">
                <span class="metricLabel">Открытые столы</span>
                <strong class="metricValue">{joinableRooms}</strong>
            </div>
            <div class="metricCard">
                <span class="metricLabel">В очереди</span>
                <strong class="metricValue">{waitingPlayers}</strong>
            </div>
            <div class="metricCard">
                <span class="metricLabel">Средний вход</span>
                <strong class="metricValue">{averageEntry.toLocaleString("ru-RU")}</strong>
            </div>
        </div>
    </section>

    <section aria-label="Режимы" class="featureStrip">
        <article class="featureCard">
            <span class="featureTag">fast</span>
            <h2>Быстрый матч</h2>
            <p>Система находит готовую комнату под выбранный шаблон.</p>
        </article>
        <article class="featureCard">
            <span class="featureTag">manual</span>
            <h2>Ручной вход</h2>
            <p>Открываете стол и сами выбираете место в комнате.</p>
        </article>
        <article class="featureCard">
            <span class="featureTag">flow</span>
            <h2>Сценарии розыгрыша</h2>
            <p>Колесо, гонки, рулетка и другие визуальные режимы уже под рукой.</p>
        </article>
    </section>

    <RoomList/>
</div>

<style lang="scss">
  @import "./+page.scss";
</style>
