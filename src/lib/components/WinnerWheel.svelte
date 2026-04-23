<script lang="ts">
    import {
        buildWheelGradient,
        buildWheelSegments,
        calculateWheelSpin,
        DEFAULT_WHEEL_SLOTS,
        MIN_WHEEL_WEIGHT,
        WHEEL_START_ANGLE,
        clampWheelWeight,
        createWeightedSlots,
        type WheelSegment,
        type WheelSlot
    } from "$lib/modules/wheel";

    const baseSlots: WheelSlot[] = DEFAULT_WHEEL_SLOTS;

    let weights: number[] = $state(baseSlots.map((slot) => slot.weight));
    let selectedWinner: number = $state(baseSlots[0].value);
    let resultWinner: number | null = $state(null);
    let isSpinning: boolean = $state(false);
    let rotation: number = $state(0);
    let spinDurationMs: number = $state(4600);
    let spinTick: number = $state(0);

    const slots = $derived(createWeightedSlots(weights, baseSlots));
    const segments = $derived(buildWheelSegments(slots));
    const wheelGradient = $derived(buildWheelGradient(slots));
    const wheelStyle = $derived(
        `transform: rotate(${rotation}deg); background: ${wheelGradient}; transition-duration: ${spinDurationMs}ms;`
    );

    function labelStyle(segment: WheelSegment): string {
        const angle = segment.absoluteCenterAngle;
        return `transform: translate(-50%, -50%) rotate(${angle}deg) translateY(-225%) rotate(${-angle}deg);`;
    }

    function setWeight(index: number, rawValue: string): void {
        const next = Number(rawValue.replace(",", "."));
        weights[index] = clampWheelWeight(next);
    }

    function resetWeights(): void {
        weights = baseSlots.map(() => 1);
    }

    function spin(): void {
        if (isSpinning) return;

        spinTick += 1;
        isSpinning = true;
        resultWinner = null;
        spinDurationMs = 4200 + (spinTick % 3) * 380;
        rotation = calculateWheelSpin(rotation, selectedWinner, 6 + (spinTick % 2), slots);
    }

    function handleTransitionEnd(): void {
        if (!isSpinning) return;
        isSpinning = false;
        resultWinner = selectedWinner;
    }
</script>

<section class="wheelSection">
    <div class="wheelHero">
        <div class="heroCopy">
            <p class="eyebrow">Контроль результата</p>
            <h1>Колесо выбора победителя</h1>
            <p class="heroText">
                Теперь размер сектора зависит от его веса. Чем больше вес, тем шире дуга, но детерминированный расчет
                все равно приводит указатель точно в центр выбранного сегмента.
            </p>
        </div>
        <div class="heroStats">
            <div>
                <span class="statLabel">Слотов</span>
                <strong>{slots.length}</strong>
            </div>
            <div>
                <span class="statLabel">Режим</span>
                <strong>Weighted deterministic</strong>
            </div>
            <div>
                <span class="statLabel">Победитель</span>
                <strong>{selectedWinner}</strong>
            </div>
        </div>
    </div>

    <div class="wheelLayout">
        <div class="wheelCard stage">
            <div class="pointer" aria-hidden="true"></div>
            <div
                aria-label={`Колесо с выбранным победителем ${selectedWinner}`}
                class:spinning={isSpinning}
                class="wheel"
                role="img"
                style={wheelStyle}
                ontransitionend={handleTransitionEnd}
            >
                {#each segments as segment, index (segment.slot.value)}
                    <div class="segmentLabel" style={labelStyle(segment)}>
                        <span>
                            <small>Сектор {index + 1}</small>
                            <strong>Число {segment.slot.label}</strong>
                        </span>
                    </div>
                {/each}
                <div class="hub">
                    <span>SPIN</span>
                </div>
            </div>
            <div class="motionTrail" aria-hidden="true"></div>
        </div>

        <div class="wheelCard controls">
            <div>
                <p class="eyebrow">Настройка</p>
                <h2>Победитель и веса</h2>
                <p class="panelText">
                    Изменяйте веса вручную. Сумма нормализуется автоматически, а расчет угла вращения привязывается к
                    фактическому центру выбранного сектора.
                </p>
            </div>

            <div class="slotPicker" role="list">
                {#each slots as slot (slot.value)}
                    <button
                        aria-pressed={selectedWinner === slot.value}
                        class:selected={selectedWinner === slot.value}
                        class="slotBtn"
                        disabled={isSpinning}
                        onclick={() => (selectedWinner = slot.value)}
                        type="button"
                    >
                        {slot.label}
                    </button>
                {/each}
            </div>

            <div class="weightsPanel">
                <div class="weightsHead">
                    <span>Вес сектора</span>
                    <button class="resetBtn" disabled={isSpinning} onclick={resetWeights} type="button">Сбросить</button>
                </div>

                <div class="weightsList">
                    {#each segments as segment, index (segment.slot.value)}
                        <label class:selected={selectedWinner === segment.slot.value} class="weightRow">
                            <span class="slotMeta">
                                <strong>Сектор #{index + 1} · {segment.slot.label}</strong>
                                <small>{(segment.normalizedWeight * 100).toFixed(1)}%</small>
                            </span>
                            <input
                                bind:value={weights[index]}
                                disabled={isSpinning}
                                min={MIN_WHEEL_WEIGHT}
                                oninput={(event) => setWeight(index, (event.currentTarget as HTMLInputElement).value)}
                                step="0.01"
                                type="number"
                            />
                        </label>
                    {/each}
                </div>
            </div>

            <button class="spinBtn" disabled={isSpinning} onclick={spin} type="button">
                {isSpinning ? "Колесо вращается..." : `Запустить на ${selectedWinner}`}
            </button>

            <div class="resultBox" data-active={resultWinner != null}>
                <span class="resultLabel">Итог</span>
                <strong>{resultWinner ?? "Ожидание"}</strong>
                <p>
                    {#if resultWinner != null}
                        Выпал выбранный сектор {resultWinner}, даже с учетом текущих весов и измененных размеров дуг.
                    {:else}
                        После запуска результат появится здесь.
                    {/if}
                </p>
            </div>
        </div>
    </div>
</section>

<style lang="scss">
  @import "./WinnerWheel.scss";
</style>
