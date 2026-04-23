<script lang="ts">
    import {onDestroy, tick} from "svelte";
    import {
        type ActiveBombState,
        type DynamiteFaction,
        type DynamiteScenario,
        generateDynamiteScenario,
        getDynamiteFactions,
        getDynamiteViewState,
        type RecentExplosionState
    } from "$lib/modules/dynamite";

    const factions: DynamiteFaction[] = getDynamiteFactions();

    let selectedWinner: number = $state(factions[0].place);
    let generation: number = $state(0);
    let scenario: DynamiteScenario = $state(generateDynamiteScenario(factions[0].place, 0));
    let elapsedMs: number = $state(0);
    let isRunning: boolean = $state(false);
    let finished: boolean = $state(false);

    let arenaElement: HTMLDivElement | null = null;
    let rafId: number | null = null;
    let startedAt = 0;

    const viewState = $derived(getDynamiteViewState(scenario, elapsedMs));
    const counts = $derived(viewState.counts);
    const activeBombs = $derived(viewState.activeBombs);
    const recentExplosions = $derived(viewState.recentExplosions);
    const aliveFactions = $derived(factions.filter((faction) => counts[faction.id] > 0));
    const selectedFaction = $derived(factions.find((faction) => faction.place === selectedWinner) ?? factions[0]);
    const winnerFaction = $derived(factions.find((faction) => faction.id === scenario.winnerId) ?? factions[0]);
    const winnerDeclared = $derived(finished ? winnerFaction : null);

    function stopLoop(): void {
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function finishMatch(): void {
        stopLoop();
        elapsedMs = scenario.durationMs;
        isRunning = false;
        finished = true;
    }

    function frame(now: number): void {
        elapsedMs = now - startedAt;
        if (elapsedMs >= scenario.durationMs) {
            finishMatch();
            return;
        }
        rafId = requestAnimationFrame(frame);
    }

    function startMatch(): void {
        stopLoop();
        generation += 1;
        scenario = generateDynamiteScenario(selectedWinner, generation);
        elapsedMs = 0;
        finished = false;
        isRunning = true;
        startedAt = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function selectWinner(place: number): void {
        if (isRunning) return;
        selectedWinner = place;
        scenario = generateDynamiteScenario(place, generation);
        elapsedMs = 0;
        finished = false;
    }

    function slotsArray(factionId: string): number[] {
        const current = counts[factionId] ?? 0;
        return Array.from({length: scenario.initialSlots}, (_, index) => index < current ? 1 : 0);
    }

    function factionCenter(factionId: string): { x: number; y: number } | null {
        const arena = arenaElement;
        if (!arena) return null;
        const card = arena.querySelector<HTMLElement>(`[data-faction-id="${factionId}"]`);
        if (!card) return null;

        const arenaRect = arena.getBoundingClientRect();
        const rect = card.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - arenaRect.left,
            y: rect.top + rect.height / 2 - arenaRect.top
        };
    }

    function bombStyle(bomb: ActiveBombState): string {
        const arena = arenaElement;
        if (!arena) return "opacity:0;";

        if (bomb.mode === "armed" && bomb.holderId) {
            const center = factionCenter(bomb.holderId);
            if (!center) return "opacity:0;";
            return `--bomb-x:${center.x}px; --bomb-y:${center.y}px; --bomb-rotation:0deg;`;
        }

        const from = bomb.fromId ? factionCenter(bomb.fromId) : null;
        const to = bomb.toId ? factionCenter(bomb.toId) : null;
        if (!from || !to) return "opacity:0;";

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const curvedY = Math.sin(bomb.progress * Math.PI) * -44;
        const x = from.x + dx * bomb.progress;
        const y = from.y + dy * bomb.progress + curvedY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        return `--bomb-x:${x}px; --bomb-y:${y}px; --bomb-rotation:${angle}deg;`;
    }

    function explosionStyle(explosion: RecentExplosionState): string {
        const center = factionCenter(explosion.targetId);
        if (!center) return "opacity:0;";
        return `--explosion-x:${center.x}px; --explosion-y:${center.y}px; --explosion-progress:${explosion.progress};`;
    }

    function countdownLabel(ms: number): string {
        return `${Math.max(0, Math.ceil(ms / 1000))}с`;
    }

    $effect(() => {
        void tick();
    });

    onDestroy(() => {
        stopLoop();
    });
</script>

<section class="dynamitePage">
    <div class="dynamiteHero">
        <div class="heroCopy">
            <p class="eyebrow">Dynamite Drop</p>
            <h1>Места кидают друг другу динамит до последнего выжившего</h1>
            <p class="heroText">
                У каждого места есть собственные слоты. Динамиты перелетают по арене, тикают, взрываются в разные
                моменты и уничтожают слоты по одному. Победитель заранее задан, но матч выглядит хаотичным и живым.
            </p>
        </div>

        <div class="heroStats">
            <div>
                <span>Слотов на место</span>
                <strong>{scenario.initialSlots}</strong>
            </div>
            <div>
                <span>Победитель</span>
                <strong>{selectedFaction.place}</strong>
            </div>
            <div>
                <span>Живых мест</span>
                <strong>{aliveFactions.length}</strong>
            </div>
        </div>
    </div>

    <div class="dynamiteLayout">
        <div class="dynamiteCard controls">
            <div class="panelHead">
                <div>
                    <p class="eyebrow">Настройка</p>
                    <h2>Выбор победителя</h2>
                </div>
                <button class="launchBtn" disabled={isRunning} onclick={startMatch} type="button">
                    {isRunning ? "Матч идёт..." : "Запустить матч"}
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
                    <span>Взрывов</span>
                    <strong>{viewState.completedExplosions}</strong>
                </div>
                <div class="statusBox">
                    <span>Прогресс</span>
                    <strong>{Math.min(100, Math.round((elapsedMs / scenario.durationMs) * 100))}%</strong>
                </div>
                <div class="statusBox">
                    <span>Победа</span>
                    <strong>{winnerDeclared?.codename ?? "ещё не определена"}</strong>
                </div>
            </div>

            <div class="eventBox">
                <span class="eventLabel">Текущая динамика</span>
                {#if activeBombs.length > 0}
                    <strong>{activeBombs.length} активных динамитов в воздухе и на таймерах</strong>
                    <p>Ближайший таймер: {countdownLabel(Math.min(...activeBombs.map((bomb) => bomb.countdownMs)))}</p>
                {:else if viewState.lastExplosion}
                    <strong>Последний взрыв у
                        места {factions.find((faction) => faction.id === viewState.lastExplosion?.targetId)?.place}</strong>
                    <p>Осталось слотов: {viewState.lastExplosion.remainingSlots}</p>
                {:else}
                    <strong>Ожидание запуска</strong>
                    <p>После старта динамиты начнут перелетать между местами.</p>
                {/if}
            </div>
        </div>

        <div class="dynamiteCard arenaCard">
            <div class="arenaHead">
                <div>
                    <p class="eyebrow">Арена</p>
                    <h2>Fuse Grid</h2>
                </div>
                <div class="arenaPill">
                    {#if isRunning}
                        <span class="liveDot"></span>
                        Горячая зона
                    {:else if finished}
                        <span class="flag">WINNER</span>
                    {:else}
                        <span class="flag">READY</span>
                    {/if}
                </div>
            </div>

            <div bind:this={arenaElement} class="battlefield">
                {#each activeBombs as bomb (bomb.id)}
                    <div
                            class:armed={bomb.mode === "armed"}
                            class="bombSprite"
                            style={`${bombStyle(bomb)} --bomb-accent:${bomb.accent}; --bomb-soft:${bomb.accentSoft};`}
                    >
                        <div class="bombBody">
                            <span class="bombFuse"></span>
                            <span class="bombTimer">{countdownLabel(bomb.countdownMs)}</span>
                        </div>
                    </div>
                {/each}

                {#each recentExplosions as explosion (explosion.bombId)}
                    <div class="explosionFx" style={explosionStyle(explosion)}>
                        <span class="flash"></span>
                        <span class="ring"></span>
                    </div>
                {/each}

                {#each factions as faction (faction.id)}
                    {@const slots = slotsArray(faction.id)}
                    {@const eliminated = (counts[faction.id] ?? 0) === 0}
                    {@const hasBomb = activeBombs.some((bomb) => bomb.holderId === faction.id)}
                    <article
                            class:eliminated
                            class:danger={hasBomb}
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

                        <div class="slotRow">
                            {#each slots as alive, slotIndex (slotIndex)}
                                <span class:destroyed={!alive} class="slotCell">
                                    <span class="slotIndex">{slotIndex + 1}</span>
                                </span>
                            {/each}
                        </div>

                        <div class="factionMeta">
                            {#if eliminated}
                                <span>все слоты уничтожены</span>
                            {:else if hasBomb}
                                <span>у них динамит</span>
                            {:else}
                                <span>готовы перебрасывать</span>
                            {/if}
                        </div>
                    </article>
                {/each}
            </div>
        </div>
    </div>
</section>

<style lang="scss">
  @import "./DynamiteArena.scss";
</style>
