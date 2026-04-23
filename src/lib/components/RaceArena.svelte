<script lang="ts">
    import {onDestroy} from "svelte";
    import {
        generateRaceScenario,
        getActiveEvent,
        getLaneProgress,
        getRaceRunners,
        type RaceLane,
        type RaceRunner,
        type RaceScenario
    } from "$lib/modules/race";

    const runners: RaceRunner[] = getRaceRunners();

    let selectedWinnerId: string = $state(runners[0].id);
    let generation: number = $state(0);
    let scenario: RaceScenario = $state(generateRaceScenario(runners[0].id, 0));
    let isRunning: boolean = $state(false);
    let finished: boolean = $state(false);
    let elapsedMs: number = $state(0);
    let winnerLane: RaceLane | null = $state(null);

    let rafId: number | null = null;
    let startedAt = 0;

    function resetScenario(nextWinnerId: string = selectedWinnerId): void {
        scenario = generateRaceScenario(nextWinnerId, generation);
        elapsedMs = 0;
        finished = false;
        winnerLane = null;
    }

    function stopLoop(): void {
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function finishRace(): void {
        stopLoop();
        isRunning = false;
        finished = true;
        elapsedMs = scenario.durationMs;
        winnerLane = [...scenario.lanes].sort((a, b) => a.finishTimeMs - b.finishTimeMs)[0] ?? null;
    }

    function tick(now: number): void {
        elapsedMs = now - startedAt;
        if (elapsedMs >= scenario.durationMs) {
            finishRace();
            return;
        }
        rafId = requestAnimationFrame(tick);
    }

    function startRace(): void {
        stopLoop();
        generation += 1;
        scenario = generateRaceScenario(selectedWinnerId, generation);
        elapsedMs = 0;
        finished = false;
        winnerLane = null;
        isRunning = true;
        startedAt = performance.now();
        rafId = requestAnimationFrame(tick);
    }

    function selectWinner(runnerId: string): void {
        if (isRunning) return;
        selectedWinnerId = runnerId;
        resetScenario(runnerId);
    }

    const laneStates = $derived.by(() =>
        scenario.lanes.map((lane) => ({
            lane,
            progress: getLaneProgress(lane, elapsedMs),
            event: getActiveEvent(lane, elapsedMs)
        }))
    );

    const ranking = $derived.by(() => [...laneStates].sort((a, b) => b.progress - a.progress));
    const leader = $derived(ranking[0] ?? null);
    const selectedRunner = $derived(runners.find((runner) => runner.id === selectedWinnerId) ?? runners[0]);

    function lanePlace(runnerId: string): number {
        const index = ranking.findIndex((item: { lane: RaceLane }) => item.lane.runner.id === runnerId);
        return index === -1 ? scenario.lanes.length : index + 1;
    }

    onDestroy(() => {
        stopLoop();
    });
</script>

<section class="racePage">
    <div class="raceHero">
        <div class="heroCopy">
            <p class="eyebrow">Детерминированные гонки</p>
            <h1>Выбираете победителя, а трасса всё равно живёт своей жизнью</h1>
            <p class="heroText">
                У машин есть бусты, просадки и смены темпа. По ходу заезда лидер может меняться, но финишный порядок
                просчитывается так, чтобы первым пришёл выбранный болид
            </p>
        </div>
        <div class="heroStats">
            <div>
                <span>Режим</span>
                <strong>Dynamic scripted race</strong>
            </div>
            <div>
                <span>Победитель</span>
                <strong>{selectedRunner.name}</strong>
            </div>
            <div>
                <span>Длительность</span>
                <strong>{Math.round(scenario.durationMs / 1000)}с</strong>
            </div>
        </div>
    </div>

    <div class="raceLayout">
        <div class="raceCard controls">
            <div class="panelHead">
                <div>
                    <p class="eyebrow">Настройка</p>
                    <h2>Выбор победителя</h2>
                </div>
                <button class="launchBtn" disabled={isRunning} onclick={startRace} type="button">
                    {isRunning ? "Гонка идёт..." : "Запустить гонку"}
                </button>
            </div>

            <div class="runnerGrid">
                {#each runners as runner (runner.id)}
                    <button
                            aria-pressed={selectedWinnerId === runner.id}
                            class:selected={selectedWinnerId === runner.id}
                            class="runnerChip"
                            disabled={isRunning}
                            onclick={() => selectWinner(runner.id)}
                            style={`--runner-accent: ${runner.accent}; --runner-soft: ${runner.accentSoft};`}
                            type="button"
                    >
                        <span class="runnerNumber">#{runner.number}</span>
                        <strong>{runner.name}</strong>
                    </button>
                {/each}
            </div>

            <div class="statusPanel">
                <div class="statusBox">
                    <span>Лидер</span>
                    <strong>{leader?.lane.runner.name ?? "Ожидание"}</strong>
                </div>
                <div class="statusBox">
                    <span>Прогресс</span>
                    <strong>{Math.min(100, Math.round((elapsedMs / scenario.durationMs) * 100))}%</strong>
                </div>
                <div class="statusBox">
                    <span>Финиш</span>
                    <strong>{winnerLane?.runner.name ?? "ещё не определён"}</strong>
                </div>
            </div>
        </div>

        <div class="raceCard trackCard">
            <div class="trackHeader">
                <div>
                    <p class="eyebrow">Трасса</p>
                    <h2>Neon Speedway</h2>
                </div>
                <div class="raceBadge">
                    {#if isRunning}
                        <span class="liveDot"></span>
                        Заезд активен
                    {:else if finished}
                        <span class="flag">FINISH</span>
                    {:else}
                        <span class="flag">READY</span>
                    {/if}
                </div>
            </div>

            <div class="track">
                {#each laneStates as laneState (laneState.lane.runner.id)}
                    <div class="laneRow">
                        <div class="laneMeta">
                            <span class="lanePlace">{lanePlace(laneState.lane.runner.id)}</span>
                            <div>
                                <strong>{laneState.lane.runner.name}</strong>
                                <small>{laneState.event?.label ?? "держит темп"}</small>
                            </div>
                        </div>

                        <div class="laneTrack">
                            <div class="finishLine" aria-hidden="true"></div>
                            <div
                                    class="vehicleWrap"
                                    style={`--progress:${laneState.progress}; --runner-accent:${laneState.lane.runner.accent}; --runner-soft:${laneState.lane.runner.accentSoft};`}
                            >
                                <div class="vehicle">
                                    <div class:eventBoost={laneState.event?.kind === "boost"}
                                         class:eventSlip={laneState.event?.kind === "slip"} class="vehicleInner">
                                        <span class="carNumber">{laneState.lane.runner.number}</span>
                                        <div class="carBody">
                                            <span class="cockpit"></span>
                                            <span class="wheel left"></span>
                                            <span class="wheel right"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</section>

<style lang="scss">
  @import "./RaceArena.scss";
</style>
