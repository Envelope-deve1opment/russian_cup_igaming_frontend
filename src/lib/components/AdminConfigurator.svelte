<script lang="ts">
    import {userStore} from "$lib/stores/userStore";

    let seats: number = $state(6);
    let entryPrice: number = $state(1500);
    let prizePercent: number = $state(55);
    let boostCost: number = $state(350);

    let prizeFund: number = $derived(Math.round((entryPrice * seats * prizePercent) / 100));

    let warnings = $derived.by(() => {
        const w: string[] = [];

        if (seats < 2 || seats > 10) w.push("Количество мест должно быть от 2 до 10");
        if (entryPrice <= 0) w.push("Цена входа должна быть больше нуля");
        if (prizePercent < 0 || prizePercent > 100) w.push("Процент призового фонда — от 0 до 100");
        if (boostCost < 0) w.push("Стоимость буста не может быть отрицательной");

        return w;
    });

    let attractiveness = $derived.by(() => {
        const balance = $userStore.bonusBalance;
        const ratioOk = entryPrice > 0 && prizeFund / entryPrice > 2;
        const priceOk = entryPrice < balance / 2;
        let score = 0;

        if (ratioOk) score += 50;
        if (priceOk) score += 50;

        return {score, ratioOk, priceOk};
    });
</script>


<section aria-labelledby="admin-title" class="admin">
    <header class="hero">
        <div class="heroCopy">
            <p class="eyebrow">Control room</p>
            <h1 class="title" id="admin-title">Сборка параметров стола.</h1>
            <p class="sub">Рабочая панель для прикидки экономики комнаты без лишних сервисных деталей.</p>
        </div>

        <div class="heroStats">
            <div class="statCard">
                <span>Фонд</span>
                <strong>{prizeFund.toLocaleString("ru-RU")}</strong>
            </div>
            <div class="statCard">
                <span>Выгодность</span>
                <strong>{attractiveness.score}%</strong>
            </div>
        </div>
    </header>

    <div class="grid">
        <label class="field range">
            <span>Места</span>
            <strong>{seats}</strong>
            <input bind:value={seats} max="10" min="2" step="1" type="range"/>
        </label>

        <label class="field">
            <span>Цена входа</span>
            <input bind:value={entryPrice} min="1" step="50" type="number"/>
        </label>

        <label class="field range">
            <span>Призовой фонд</span>
            <strong>{prizePercent}%</strong>
            <input bind:value={prizePercent} max="100" min="0" step="1" type="range"/>
            <small>{prizeFund.toLocaleString("ru-RU")} в пуле</small>
        </label>

        <label class="field">
            <span>Boost</span>
            <input bind:value={boostCost} min="0" step="25" type="number"/>
        </label>
    </div>

    <div aria-label="Привлекательность конфигурации" class="meter">
        <div class="meterTop">
            <span>Оценка конфигурации</span>
            <span class="meterVal">{attractiveness.score}%</span>
        </div>
        <div aria-valuemax="100" aria-valuemin="0" aria-valuenow={attractiveness.score} class="bar" role="progressbar">
            <div class="barFill" style={`width:${attractiveness.score}%`}></div>
        </div>
        <ul class="checks">
            <li data-ok={attractiveness.ratioOk}>Фонд минимум в 2 раза выше входа</li>
            <li data-ok={attractiveness.priceOk}>Вход не съедает больше половины баланса игрока</li>
        </ul>
    </div>

    {#if warnings.length}
        <div class="warn" role="alert">
            {#each warnings as w (w)}
                <p>{w}</p>
            {/each}
        </div>
    {/if}
</section>


<style lang="scss">
  @import "./AdminConfigurator.scss";
</style>
