<script lang="ts">
    import {onDestroy, onMount} from "svelte";
    import {
        buildFlatRouletteStrip,
        calculateNextStopIndex,
        FLAT_ROULETTE_INITIAL_INDEX,
        getFlatRouletteItems,
        type FlatRouletteItem
    } from "$lib/modules/roulette";

    const items: FlatRouletteItem[] = getFlatRouletteItems();
    const stripItems: FlatRouletteItem[] = buildFlatRouletteStrip();

    let selectedWinner: number = $state(items[0].value);
    let resultWinner: number | null = $state(null);
    let isSpinning: boolean = $state(false);
    let spinTick: number = $state(0);
    let stopIndex: number = $state(FLAT_ROULETTE_INITIAL_INDEX);
    let trackOffset: number = $state(0);
    let transitionMs: number = $state(0);

    let viewportElement: HTMLDivElement | null = null;
    let trackElement: HTMLDivElement | null = null;
    let viewportWidth: number = $state(0);
    let resizeObserver: ResizeObserver | null = null;

    function colorClass(color: FlatRouletteItem["color"]): string {
        return color;
    }

    function getTileElement(index: number): HTMLDivElement | null {
        return trackElement?.querySelector(`[data-flat-index="${index}"]`) ?? null;
    }

    function syncOffset(animate: boolean = false): void {
        if (viewportWidth <= 0) return;
        const tile = getTileElement(stopIndex);
        if (!tile) return;

        transitionMs = animate ? transitionMs : 0;
        const center = tile.offsetLeft + tile.offsetWidth / 2;
        trackOffset = viewportWidth / 2 - center;
    }

    function updateViewportWidth(): void {
        viewportWidth = viewportElement?.clientWidth ?? 0;
        syncOffset(false);
    }

    function spin(): void {
        if (isSpinning || viewportWidth <= 0) return;

        spinTick += 1;
        isSpinning = true;
        resultWinner = null;
        transitionMs = 4600 + (spinTick % 2) * 420;
        stopIndex = calculateNextStopIndex(stopIndex, selectedWinner, items);
        syncOffset(true);
    }

    function finishSpin(): void {
        if (!isSpinning) return;
        isSpinning = false;
        resultWinner = selectedWinner;
    }

    const trackStyle = $derived(
        `transform: translateX(${trackOffset}px); transition-duration: ${transitionMs}ms;`
    );

    onMount(() => {
        updateViewportWidth();

        if (viewportElement && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                updateViewportWidth();
            });
            resizeObserver.observe(viewportElement);
        }
    });

    onDestroy(() => {
        resizeObserver?.disconnect();
    });
</script>

<section class="roulettePage">
    <div class="rouletteHero">
        <div class="heroCopy">
            <p class="eyebrow">Flat Roulette</p>
            <h1>Плоская рулетка по местам от 2 до 10</h1>
            <p class="heroText">
                Лента крутится как в казино-режимах с горизонтальной рулеткой, но итог по‑прежнему предопределён:
                выбранное место точно встанет под центральный маркер.
            </p>
        </div>
        <div class="heroStats">
            <div>
                <span>Диапазон</span>
                <strong>2-10</strong>
            </div>
            <div>
                <span>Выигрыш</span>
                <strong>{selectedWinner}</strong>
            </div>
            <div>
                <span>Режим</span>
                <strong>Deterministic strip</strong>
            </div>
        </div>
    </div>

    <div class="rouletteLayout">
        <div class="rouletteCard stage">
            <div class="stageHead">
                <p class="eyebrow">Лента</p>
                <h2>Live Drop</h2>
            </div>

            <div bind:this={viewportElement} class="stripViewport">
                <div class="centerGlow" aria-hidden="true"></div>
                <div class="marker" aria-hidden="true"></div>
                <div bind:this={trackElement} class="stripTrack" ontransitionend={finishSpin} style={trackStyle}>
                    {#each stripItems as item, index (`${item.value}-${index}`)}
                        <div class={`stripTile ${colorClass(item.color)}`} data-flat-index={index}>
                            <span class="tileOverline">Место</span>
                            <strong>{item.value}</strong>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="stageLegend">
                <span>Маркер показывает выигрышный слот в центре.</span>
                <strong>{isSpinning ? "Идёт прокрутка..." : "Готово к запуску"}</strong>
            </div>
        </div>

        <div class="rouletteCard controls">
            <div class="panelHead">
                <div>
                    <p class="eyebrow">Настройка</p>
                    <h2>Выбор места</h2>
                </div>
                <button class="spinBtn" disabled={isSpinning || viewportWidth <= 0} onclick={spin} type="button">
                    {isSpinning ? "Крутим..." : `Запустить на ${selectedWinner}`}
                </button>
            </div>

            <div class="resultBox" data-active={resultWinner != null}>
                <span class="resultLabel">Итог</span>
                <strong>{resultWinner ?? "Ожидание"}</strong>
                <p>
                    {#if resultWinner != null}
                        Под маркером остановилось место {resultWinner}.
                    {:else}
                        После прокрутки здесь появится выигрышное место.
                    {/if}
                </p>
            </div>

            <div class="numberGrid">
                {#each items as item (item.value)}
                    <button
                        aria-pressed={selectedWinner === item.value}
                        class:selected={selectedWinner === item.value}
                        class={`numberBtn ${colorClass(item.color)}`}
                        disabled={isSpinning}
                        onclick={() => (selectedWinner = item.value)}
                        type="button"
                    >
                        <span>Место</span>
                        <strong>{item.value}</strong>
                    </button>
                {/each}
            </div>
        </div>
    </div>
</section>

<style lang="scss">
  @import "./RouletteTable.scss";
</style>
