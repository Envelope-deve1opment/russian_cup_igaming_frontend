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
    <header class="head">
        <h1 class="title" id="admin-title">Конфигуратор комнаты</h1>
        <p class="sub">Черновые параметры стола для администратора. Расчёты только на клиенте</p>
    </header>

    <div class="grid">
        <label class="field">
            <span>Места (2–10)</span>
            <input bind:value={seats} max="10" min="2" step="1" type="range"/>
            <output>{seats}</output>
        </label>

        <label class="field">
            <span>Цена входа</span>
            <input bind:value={entryPrice} min="1" step="50" type="number"/>
        </label>

        <label class="field">
            <span>Призовой фонд, % от «пула»</span>
            <input bind:value={prizePercent} max="100" min="0" step="1" type="range"/>
            <output>{prizePercent}% → {prizeFund.toLocaleString("ru-RU")}</output>
        </label>

        <label class="field">
            <span>Стоимость буста</span>
            <input bind:value={boostCost} min="0" step="25" type="number"/>
        </label>
    </div>

    <div aria-label="Привлекательность конфигурации" class="meter">
        <div class="meterTop">
            <span>Привлекательность / выгодность</span>
            <span class="meterVal">{attractiveness.score}%</span>
        </div>
        <div aria-valuemax="100" aria-valuemin="0" aria-valuenow={attractiveness.score} class="bar" role="progressbar">
            <div class="barFill" style={`width:${attractiveness.score}%`}></div>
        </div>
        <ul class="checks">
            <li data-ok={attractiveness.ratioOk}>prizeFund / entryPrice &gt; 2</li>
            <li data-ok={attractiveness.priceOk}>entryPrice &lt; баланс / 2</li>
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
