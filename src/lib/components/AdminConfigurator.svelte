<script lang="ts">
    import {onMount} from "svelte";
    import {APIError} from "$lib/api/baseAPI";
    import {roomTemplateService} from "$lib/api/roomTemplateService";
    import type {RoomTemplateDto} from "$lib/api/dto";
    import {userStore} from "$lib/stores/userStore";
    import {ROOM_GAME_IDS, ROOM_GAME_LABEL, type RoomGameId} from "$lib/constants/roomGame";

    type TemplateForm = {
        id: string;
        templateName: string;
        entryFee: number;
        commissionPercentage: number;
        gameType: RoomGameId;
        participantsCount: number;
        active: boolean;
        boostEnabled: boolean;
        boostCost: number;
        boostMultiplier: number;
        countdownSeconds: number;
        createdAt?: string;
        updatedAt?: string;
    };

    const DEFAULT_PARTICIPANTS_COUNT = 6;
    const DEFAULT_ENTRY_FEE = 1500;
    const DEFAULT_COUNTDOWN_SECONDS = 30;

    function sortTemplates(list: RoomTemplateDto[]): RoomTemplateDto[] {
        return [...list].sort((a, b) => {
            if ((a.active ?? false) !== (b.active ?? false)) {
                return (a.active ?? false) ? -1 : 1;
            }

            const aUpdated = a.updatedAt ?? a.createdAt ?? "";
            const bUpdated = b.updatedAt ?? b.createdAt ?? "";
            return bUpdated.localeCompare(aUpdated) || a.templateName.localeCompare(b.templateName);
        });
    }

    function normalizeTemplate(dto: RoomTemplateDto): TemplateForm {
        return {
            id: dto.id,
            templateName: dto.templateName ?? "",
            entryFee: dto.entryFee ?? DEFAULT_ENTRY_FEE,
            commissionPercentage: dto.commissionPercentage ?? 10,
            gameType: dto.gameType ?? "WHEEL",
            participantsCount: dto.participantsCount ?? DEFAULT_PARTICIPANTS_COUNT,
            active: dto.active ?? true,
            boostEnabled: dto.boostEnabled ?? false,
            boostCost: dto.boostCost ?? 0,
            boostMultiplier: dto.boostMultiplier ?? 15,
            countdownSeconds: dto.countdownSeconds ?? DEFAULT_COUNTDOWN_SECONDS,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt
        };
    }

    function toTemplateDto(form: TemplateForm): RoomTemplateDto {
        return {
            id: form.id,
            templateName: form.templateName.trim(),
            entryFee: form.entryFee,
            commissionPercentage: form.commissionPercentage,
            gameType: form.gameType,
            participantsCount: form.participantsCount,
            active: form.active,
            boostEnabled: form.boostEnabled,
            boostCost: form.boostEnabled ? form.boostCost : 0,
            boostMultiplier: form.boostEnabled ? form.boostMultiplier : 15,
            countdownSeconds: form.countdownSeconds,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt
        };
    }

    function serializeForm(form: TemplateForm | null): string {
        if (form == null) {
            return "";
        }

        return JSON.stringify({
            templateName: form.templateName.trim(),
            entryFee: form.entryFee,
            commissionPercentage: form.commissionPercentage,
            gameType: form.gameType,
            participantsCount: form.participantsCount,
            active: form.active,
            boostEnabled: form.boostEnabled,
            boostCost: form.boostEnabled ? form.boostCost : 0,
            countdownSeconds: form.countdownSeconds
        });
    }

    function toMessage(error: unknown, fallback: string): string {
        if (error instanceof APIError && error.message) {
            return error.message;
        }

        return error instanceof Error && error.message ? error.message : fallback;
    }

    let templates: RoomTemplateDto[] = $state([]);
    let selectedTemplateId: string | null = $state(null);
    let form: TemplateForm | null = $state(null);
    let savedSnapshot: string = $state("");
    let createName: string = $state("");
    let feedback: { tone: "error" | "success"; text: string } | null = $state(null);
    let loading: boolean = $state(true);
    let createPending: boolean = $state(false);
    let savePending: boolean = $state(false);
    let deletePending: boolean = $state(false);

    const selectedTemplate = $derived(templates.find((item) => item.id === selectedTemplateId) ?? null);
    const isDirty = $derived(form != null && serializeForm(form) !== savedSnapshot);
    const activeTemplates = $derived(templates.filter((item) => item.active ?? false).length);
    const boostTemplates = $derived(templates.filter((item) => item.boostEnabled ?? false).length);
    const averageEntry = $derived(
        templates.length === 0
            ? 0
            : Math.round(templates.reduce((sum, item) => sum + (item.entryFee ?? 0), 0) / templates.length)
    );

    const warnings = $derived.by(() => {
        const next: string[] = [];
        if (!form) return next;

        if (!form.templateName.trim()) next.push("Название шаблона обязательно.");
        if (form.participantsCount < 2 || form.participantsCount > 10) next.push("Количество мест должно быть от 2 до 10.");
        if (form.entryFee < 0) next.push("Стоимость входа не может быть отрицательной.");
        if (form.commissionPercentage < 0 || form.commissionPercentage > 50) next.push("Комиссия должна быть от 0 до 50%.");
        if (form.countdownSeconds < 0) next.push("Таймер не может быть отрицательным.");
        if (form.boostEnabled && form.boostCost < 0) next.push("Стоимость буста не может быть отрицательной.");

        return next;
    });

    const attractiveness = $derived.by(() => {
        if (!form) {
            return {score: 0, ratioOk: false, priceOk: false};
        }

        const balance = $userStore.bonusBalance;
        const prizeFund = form.entryFee * form.participantsCount;
        const ratioOk = form.entryFee > 0 && prizeFund / form.entryFee >= 4;
        const priceOk = balance <= 0 || form.entryFee <= balance / 2;
        let score = 0;

        if (ratioOk) score += 50;
        if (priceOk) score += 50;

        return {score, ratioOk, priceOk};
    });

    function applySelection(template: RoomTemplateDto | null): void {
        selectedTemplateId = template?.id ?? null;
        form = template ? normalizeTemplate(template) : null;
        savedSnapshot = serializeForm(form);
        feedback = null;
    }

    function confirmDiscardChanges(): boolean {
        if (!isDirty) {
            return true;
        }

        if (typeof window === "undefined") {
            return false;
        }

        return window.confirm("Есть несохранённые изменения. Сбросить их?");
    }

    function selectTemplate(template: RoomTemplateDto): void {
        if (selectedTemplateId === template.id) {
            return;
        }

        if (!confirmDiscardChanges()) {
            return;
        }

        applySelection(template);
    }

    function updateForm<K extends keyof TemplateForm>(key: K, value: TemplateForm[K]): void {
        if (form == null) {
            return;
        }

        form = {...form, [key]: value};
    }

    async function loadTemplates(preferredId?: string): Promise<void> {
        try {
            loading = true;
            const list = sortTemplates(await roomTemplateService.getAll());
            templates = list;

            const nextId = preferredId ?? selectedTemplateId ?? list[0]?.id ?? null;
            const nextTemplate = nextId == null ? null : list.find((item) => item.id === nextId) ?? list[0] ?? null;

            if (nextTemplate) {
                applySelection(nextTemplate);
            } else {
                applySelection(null);
            }
        } catch (error) {
            feedback = {tone: "error", text: toMessage(error, "Не удалось загрузить шаблоны комнат.")};
        } finally {
            loading = false;
        }
    }

    async function createTemplate(): Promise<void> {
        const templateName = createName.trim();
        if (!templateName || createPending) {
            return;
        }

        if (!confirmDiscardChanges()) {
            return;
        }

        try {
            createPending = true;
            const created = await roomTemplateService.create({templateName});
            templates = sortTemplates([...templates, created]);
            createName = "";
            applySelection(created);
            feedback = {tone: "success", text: "Шаблон создан. Заполните параметры и сохраните его."};
        } catch (error) {
            feedback = {tone: "error", text: toMessage(error, "Не удалось создать шаблон.")};
        } finally {
            createPending = false;
        }
    }

    async function saveTemplate(): Promise<void> {
        if (!form || savePending || warnings.length > 0) {
            return;
        }

        try {
            savePending = true;
            const updated = await roomTemplateService.update(toTemplateDto(form));
            templates = sortTemplates(templates.map((item) => item.id === updated.id ? updated : item));
            applySelection(updated);
            feedback = {tone: "success", text: "Шаблон сохранён."};
        } catch (error) {
            feedback = {tone: "error", text: toMessage(error, "Не удалось сохранить шаблон.")};
        } finally {
            savePending = false;
        }
    }

    async function deleteTemplate(): Promise<void> {
        if (!selectedTemplate || deletePending) {
            return;
        }

        if (typeof window !== "undefined" && !window.confirm(`Удалить шаблон «${selectedTemplate.templateName}»?`)) {
            return;
        }

        try {
            deletePending = true;
            const removedId = selectedTemplate.id;
            await roomTemplateService.remove(removedId);

            const remaining = templates.filter((item) => item.id !== removedId);
            templates = sortTemplates(remaining);
            applySelection(remaining[0] ?? null);
            feedback = {tone: "success", text: "Шаблон удалён."};
        } catch (error) {
            feedback = {tone: "error", text: toMessage(error, "Не удалось удалить шаблон.")};
        } finally {
            deletePending = false;
        }
    }

    onMount(() => {
        void loadTemplates();
    });
</script>


<section aria-labelledby="admin-title" class="admin">
    <header class="hero">
        <div class="heroCopy">
            <p class="eyebrow">Templates</p>
            <h1 class="title" id="admin-title">Управление шаблонами комнат</h1>
            <p class="sub">Создание идёт по имени, затем полный набор параметров сохраняется отдельным обновлением</p>
        </div>

        <div class="heroStats">
            <div class="statCard">
                <span>Шаблонов</span>
                <strong>{templates.length}</strong>
            </div>
            <div class="statCard">
                <span>Активных</span>
                <strong>{activeTemplates}</strong>
            </div>
            <div class="statCard">
                <span>Средний вход</span>
                <strong>{averageEntry.toLocaleString("ru-RU")}</strong>
            </div>
            <div class="statCard">
                <span>С бустом</span>
                <strong>{boostTemplates}</strong>
            </div>
        </div>
    </header>

    <div class="workspace">
        <aside class="sidebar">
            <section class="card createCard">
                <div class="sectionHead">
                    <h2>Новый шаблон</h2>
                    <p>Шаг 1. Только название.</p>
                </div>

                <div class="createRow">
                    <input
                            bind:value={createName}
                            class="textInput"
                            maxlength="120"
                            placeholder="Например, VIP Turbo x6"
                            type="text"
                    />
                    <button class="primaryBtn" disabled={createPending || !createName.trim()} onclick={createTemplate}
                            type="button">
                        {createPending ? "Создаём..." : "Создать"}
                    </button>
                </div>
            </section>

            <section class="card listCard">
                <div class="sectionHead">
                    <h2>Шаблоны</h2>
                    <p>Шаг 2. Выберите и настройте.</p>
                </div>

                {#if loading}
                    <p class="placeholder">Загружаем шаблоны…</p>
                {:else if templates.length === 0}
                    <p class="placeholder">Шаблонов пока нет.</p>
                {:else}
                    <div class="templateList">
                        {#each templates as template (template.id)}
                            <button
                                    class:selected={selectedTemplateId === template.id}
                                    class="templateItem"
                                    onclick={() => selectTemplate(template)}
                                    type="button"
                            >
                                <div class="templateTop">
                                    <strong>{template.templateName}</strong>
                                    <span class:off={!(template.active ?? false)} class="statusPill">
                                        {template.active ?? false ? "active" : "off"}
                                    </span>
                                </div>
                                <div class="templateMeta">
                                    <span>{ROOM_GAME_LABEL[template.gameType ?? "WHEEL"]}</span>
                                    <span>{(template.entryFee ?? DEFAULT_ENTRY_FEE).toLocaleString("ru-RU")}</span>
                                    <span>{template.participantsCount ?? DEFAULT_PARTICIPANTS_COUNT} мест</span>
                                    <span>{template.boostEnabled ? "boost" : "no boost"}</span>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </section>
        </aside>

        <section class="card editorCard">
            {#if form == null}
                <div class="emptyEditor">
                    <h2>Выберите шаблон</h2>
                    <p>После создания или выбора слева откроется форма полного редактирования.</p>
                </div>
            {:else}
                <div class="editorHead">
                    <div>
                        <p class="eyebrow small">Editor</p>
                        <h2>{form.templateName || "Без названия"}</h2>
                    </div>
                    <div class="editorActions">
                        <button class="ghostBtn" disabled={deletePending || savePending} onclick={deleteTemplate}
                                type="button">
                            {deletePending ? "Удаляем..." : "Удалить"}
                        </button>
                        <button class="primaryBtn" disabled={savePending || warnings.length > 0 || !isDirty}
                                onclick={saveTemplate} type="button">
                            {savePending ? "Сохраняем..." : "Сохранить"}
                        </button>
                    </div>
                </div>

                <div class="formGrid">
                    <label class="field wide">
                        <span>Название шаблона</span>
                        <input
                                class="textInput"
                                oninput={(event) => updateForm("templateName", (event.currentTarget as HTMLInputElement).value)}
                                type="text"
                                value={form.templateName}
                        />
                    </label>

                    <label class="field">
                        <span>Стоимость входа</span>
                        <input
                                class="textInput"
                                min="0"
                                oninput={(event) => updateForm("entryFee", Number((event.currentTarget as HTMLInputElement).value))}
                                step="50"
                                type="number"
                                value={form.entryFee}
                        />
                    </label>

                    <label class="field">
                        <span>Стоимость входа для ботов</span>
                        <input
                                class="textInput"
                                type="number"
                                value="500"
                        />
                    </label>

                    <label class="field">
                        <span>Комиссия, %</span>
                        <input
                                class="textInput"
                                min="0"
                                max="50"
                                oninput={(event) => updateForm("commissionPercentage", Number((event.currentTarget as HTMLInputElement).value))}
                                step="1"
                                type="number"
                                value={form.commissionPercentage}
                        />
                    </label>

                    <label class="field">
                        <span>Тип игры</span>
                        <select
                                class="textInput"
                                onchange={(event) => updateForm("gameType", (event.currentTarget as HTMLSelectElement).value as RoomGameId)}
                                value={form.gameType}
                        >
                            {#each ROOM_GAME_IDS as gameId}
                                <option value={gameId}>{ROOM_GAME_LABEL[gameId]}</option>
                            {/each}
                        </select>
                    </label>

                    <label class="field">
                        <span>Мест за столом</span>
                        <input
                                class="textInput"
                                max="10"
                                min="2"
                                oninput={(event) => updateForm("participantsCount", Number((event.currentTarget as HTMLInputElement).value))}
                                step="1"
                                type="number"
                                value={form.participantsCount}
                        />
                    </label>

                    <label class="field">
                        <span>Таймер ожидания, сек</span>
                        <input
                                class="textInput"
                                min="0"
                                oninput={(event) => updateForm("countdownSeconds", Number((event.currentTarget as HTMLInputElement).value))}
                                step="1"
                                type="number"
                                value={form.countdownSeconds}
                        />
                    </label>

                    <label class="field">
                        <span>Стоимость буста</span>
                        <input
                                class="textInput"
                                disabled={!form.boostEnabled}
                                min="0"
                                oninput={(event) => updateForm("boostCost", Number((event.currentTarget as HTMLInputElement).value))}
                                step="25"
                                type="number"
                                value={form.boostCost}
                        />
                    </label>

                    <label class="field">
                        <span>Сила бустера</span>
                        <input
                                class="textInput"
                                disabled={!form.boostEnabled}
                                min="1"
                                max="50"
                                oninput={(event) => updateForm("boostMultiplier", Number((event.currentTarget as HTMLInputElement).value))}
                                step="1"
                                type="number"
                                value={form.boostMultiplier}
                        />
                    </label>

                    <label class="toggleField">
                        <input
                                checked={form.active}
                                onchange={(event) => updateForm("active", (event.currentTarget as HTMLInputElement).checked)}
                                type="checkbox"
                        />
                        <span>
                            <strong>Шаблон активен</strong>
                            <small>Будет доступен в общем пуле шаблонов.</small>
                        </span>
                    </label>

                    <label class="toggleField">
                        <input
                                checked={form.boostEnabled}
                                onchange={(event) => updateForm("boostEnabled", (event.currentTarget as HTMLInputElement).checked)}
                                type="checkbox"
                        />
                        <span>
                            <strong>Буст включён</strong>
                            <small>Игроки смогут покупать усиление в комнате.</small>
                        </span>
                    </label>
                </div>

                <div aria-label="Оценка шаблона" class="meter">
                    <div class="meterTop">
                        <span>Оценка конфигурации</span>
                        <span class="meterVal">{attractiveness.score}%</span>
                    </div>
                    <div aria-valuemax="100" aria-valuemin="0" aria-valuenow={attractiveness.score} class="bar"
                         role="progressbar">
                        <div class="barFill" style={`width:${attractiveness.score}%`}></div>
                    </div>
                    <ul class="checks">
                        <li data-ok={attractiveness.ratioOk}>Общий пул заметно выше стоимости входа</li>
                        <li data-ok={attractiveness.priceOk}>Вход не слишком агрессивен к текущему банку игрока</li>
                    </ul>
                </div>

                <div class="metaRow">
                    <span>ID: {form.id}</span>
                    <span>Создан: {form.createdAt ? new Date(form.createdAt).toLocaleString("ru-RU") : "—"}</span>
                    <span>Обновлён: {form.updatedAt ? new Date(form.updatedAt).toLocaleString("ru-RU") : "—"}</span>
                </div>

                {#if warnings.length > 0}
                    <div class="warn" role="alert">
                        {#each warnings as warning (warning)}
                            <p>{warning}</p>
                        {/each}
                    </div>
                {/if}
            {/if}
        </section>
    </div>

    {#if feedback}
        <div class:success={feedback.tone === "success"} class="feedback" role="status">
            {feedback.text}
        </div>
    {/if}
</section>


<style lang="scss">
  @import "./AdminConfigurator.scss";
</style>
