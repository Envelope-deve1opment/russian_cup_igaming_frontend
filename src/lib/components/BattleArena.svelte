<script lang="ts">
    import {onDestroy, tick} from "svelte";
    import {
        generateBattleScenario,
        getBattleFactions,
        getBattleViewState,
        type BattleFaction,
        type BattleScenario
    } from "$lib/modules/battle";

    type ShotState = {
        x: number;
        y: number;
        length: number;
        angle: number;
        accent: string;
        targetAccent: string;
        key: number;
    } | null;

    const factions: BattleFaction[] = getBattleFactions();

    let selectedWinner: number = $state(factions[0].place);
    let generation: number = $state(0);
    let scenario: BattleScenario = $state(generateBattleScenario(factions[0].place, 0));
    let elapsedMs: number = $state(0);
    let isRunning: boolean = $state(false);
    let finished: boolean = $state(false);
    let shotState: ShotState = $state(null);

    let rafId: number | null = null;
    let startedAt = 0;
    let battlefieldElement: HTMLDivElement | null = null;
    let shotKey = 0;
    let lastEventTime = -1;

    const battleState = $derived(getBattleViewState(scenario, elapsedMs));
    const counts = $derived(battleState.counts);
    const currentEvent = $derived(battleState.currentEvent);
    const selectedFaction = $derived(factions.find((faction) => faction.place === selectedWinner) ?? factions[0]);
    const winnerFaction = $derived(factions.find((faction) => faction.id === scenario.winnerId) ?? factions[0]);
    const aliveFactions = $derived(factions.filter((faction) => counts[faction.id] > 0));
    const winnerDeclared = $derived(finished ? winnerFaction : null);

    function restartScenario(winnerPlace: number = selectedWinner): void {
        scenario = generateBattleScenario(winnerPlace, generation);
        elapsedMs = 0;
        isRunning = false;
        finished = false;
        shotState = null;
        lastEventTime = -1;
    }

    function stopLoop(): void {
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function finishBattle(): void {
        stopLoop();
        elapsedMs = scenario.durationMs;
        isRunning = false;
        finished = true;
    }

    function step(now: number): void {
        elapsedMs = now - startedAt;
        if (elapsedMs >= scenario.durationMs) {
            finishBattle();
            return;
        }
        rafId = requestAnimationFrame(step);
    }

    async function renderShot(): Promise<void> {
        const event = currentEvent;
        const field = battlefieldElement;
        if (!event || !field) return;
        if (event.timeMs === lastEventTime) return;

        await tick();

        const attacker = field.querySelector<HTMLElement>(`[data-faction-id="${event.attackerId}"]`);
        const target = field.querySelector<HTMLElement>(`[data-faction-id="${event.targetId}"]`);
        if (!attacker || !target) return;

        const fieldRect = field.getBoundingClientRect();
        const a = attacker.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - fieldRect.left;
        const y1 = a.top + a.height / 2 - fieldRect.top;
        const x2 = t.left + t.width / 2 - fieldRect.left;
        const y2 = t.top + t.height / 2 - fieldRect.top;
        const dx = x2 - x1;
        const dy = y2 - y1;

        shotKey += 1;
        shotState = {
            x: x1,
            y: y1,
            length: Math.hypot(dx, dy),
            angle: Math.atan2(dy, dx) * 180 / Math.PI,
            accent: factions.find((faction) => faction.id === event.attackerId)?.accent ?? "#fff",
            targetAccent: factions.find((faction) => faction.id === event.targetId)?.accent ?? "#fff",
            key: shotKey
        };
        lastEventTime = event.timeMs;
    }

    function startBattle(): void {
        stopLoop();
        generation += 1;
        scenario = generateBattleScenario(selectedWinner, generation);
        elapsedMs = 0;
        finished = false;
        shotState = null;
        lastEventTime = -1;
        isRunning = true;
        startedAt = performance.now();
        rafId = requestAnimationFrame(step);
    }

    function selectWinner(place: number): void {
        if (isRunning) return;
        selectedWinner = place;
        restartScenario(place);
    }

    function soldiersVisible(count: number): number[] {
        return Array.from({length: Math.min(count, 8)}, (_, index) => index);
    }

    function healthRatio(factionId: string): number {
        const current = counts[factionId] ?? 0;
        const initial = scenario.initialCounts[factionId] ?? 1;
        return Math.max(0, Math.min(1, current / initial));
    }

    $effect(() => {
        void renderShot();
    });

    onDestroy(() => {
        stopLoop();
    });
</script>

<section class="battlePage">
    <div class="battleHero">
        <div class="heroCopy">
            <p class="eyebrow">Battle Sim</p>
            <h1>Тактическая бойня с предопределённым победителем</h1>
            <p class="heroText">
                Отряды мест `2..10` обстреливают друг друга, теряют бойцов, меняют темп боя и вылетают из матча.
                Сценарий выглядит живым, но финальный победитель заранее определён.
            </p>
        </div>

        <div class="heroStats">
            <div>
                <span>Фракций</span>
                <strong>{factions.length}</strong>
            </div>
            <div>
                <span>Победитель</span>
                <strong>{selectedFaction.title}</strong>
            </div>
            <div>
                <span>Живых</span>
                <strong>{aliveFactions.length}</strong>
            </div>
        </div>
    </div>

    <div class="battleLayout">
        <div class="battleCard controls">
            <div class="panelHead">
                <div>
                    <p class="eyebrow">Настройка</p>
                    <h2>Выбор победителя</h2>
                </div>
                <button class="launchBtn" disabled={isRunning} onclick={startBattle} type="button">
                    {isRunning ? "Бой идёт..." : "Начать сражение"}
                </button>
            </div>

            <div class="winnerGrid">
                {#each factions as faction (faction.id)}
                    <button
                        aria-pressed={selectedWinner === faction.place}
                        class:selected={selectedWinner === faction.place}
                        class="winnerChip"
                        disabled={isRunning}
                        onclick={() => selectWinner(faction.place)}
                        style={`--faction-accent:${faction.accent}; --faction-soft:${faction.accentSoft};`}
                        type="button"
                    >
                        <span class="chipPlace">{faction.place}</span>
                        <strong>{faction.codename}</strong>
                    </button>
                {/each}
            </div>

            <div class="statusGrid">
                <div class="statusBox">
                    <span>Событий</span>
                    <strong>{battleState.completedEvents}</strong>
                </div>
                <div class="statusBox">
                    <span>Прогресс</span>
                    <strong>{Math.min(100, Math.round((elapsedMs / scenario.durationMs) * 100))}%</strong>
                </div>
                <div class="statusBox">
                    <span>Исход</span>
                    <strong>{winnerDeclared?.codename ?? "ещё идёт"}</strong>
                </div>
            </div>

            <div class="eventBox">
                <span class="eventLabel">Текущий эпизод</span>
                {#if currentEvent}
                    <strong>
                        {factions.find((faction) => faction.id === currentEvent.attackerId)?.title}
                        {currentEvent.label}
                        {factions.find((faction) => faction.id === currentEvent.targetId)?.title}
                    </strong>
                    <p>Потери: {currentEvent.kills} · {currentEvent.eliminated ? "отряд уничтожен" : "бой продолжается"}</p>
                {:else}
                    <strong>Ожидание запуска</strong>
                    <p>После старта здесь будет появляться последний удар.</p>
                {/if}
            </div>
        </div>

        <div class="battleCard fieldCard">
            <div class="fieldHead">
                <div>
                    <p class="eyebrow">Поле боя</p>
                    <h2>Sector Zero</h2>
                </div>
                <div class="battleStatePill">
                    {#if isRunning}
                        <span class="liveDot"></span>
                        Контакт
                    {:else if finished}
                        <span class="flag">WINNER</span>
                    {:else}
                        <span class="flag">READY</span>
                    {/if}
                </div>
            </div>

            <div bind:this={battlefieldElement} class="battlefield">
                {#if shotState}
                    {#key shotState.key}
                        <div
                            class="shot"
                            style={`--shot-x:${shotState.x}px; --shot-y:${shotState.y}px; --shot-length:${shotState.length}px; --shot-angle:${shotState.angle}deg; --shot-accent:${shotState.accent}; --shot-target:${shotState.targetAccent};`}
                        >
                            <span class="beam"></span>
                            <span class="impact"></span>
                        </div>
                    {/key}
                {/if}

                {#each factions as faction, index (faction.id)}
                    {@const activeAttack = currentEvent?.attackerId === faction.id}
                    {@const activeTarget = currentEvent?.targetId === faction.id}
                    {@const eliminated = counts[faction.id] === 0}
                    <article
                        class:attacking={activeAttack}
                        class:eliminated={eliminated}
                        class:targeted={activeTarget}
                        class="factionCard"
                        data-faction-id={faction.id}
                        style={`--faction-accent:${faction.accent}; --faction-soft:${faction.accentSoft};`}
                    >
                        <div class="factionTop">
                            <div>
                                <span class="factionPlace">Место {faction.place}</span>
                                <h3>{faction.codename}</h3>
                            </div>
                            <span class="remaining">{counts[faction.id]}</span>
                        </div>

                        <div class="healthBar">
                            <span style={`width:${healthRatio(faction.id) * 100}%`}></span>
                        </div>

                        <div class="soldiers">
                            {#each soldiersVisible(counts[faction.id]) as _, soldierIndex (soldierIndex)}
                                <span class="soldier"></span>
                            {/each}
                        </div>

                        <div class="factionMeta">
                            {#if eliminated}
                                <span>отряд выбыл</span>
                            {:else if activeAttack}
                                <span>ведёт огонь</span>
                            {:else if activeTarget}
                                <span>под огнём</span>
                            {:else}
                                <span>держит линию</span>
                            {/if}
                        </div>
                    </article>
                {/each}
            </div>
        </div>
    </div>
</section>

<style lang="scss">
  @import "./BattleArena.scss";
</style>
