<script lang="ts">
    import {setTheme, type ThemeId, THEMES, themeStore} from "$lib/stores/themeStore";

    function onchange(e: Event): void {
        const v = (e.currentTarget as HTMLSelectElement).value;

        if (THEMES.some((t) => t.id === v)) {
            setTheme(v as ThemeId);
        }
    }
</script>

<div class="wrap">
    <span class="label" id="theme-label">Тема</span>
    <select
            aria-labelledby="theme-label"
            class="select"
            onchange={onchange}
            value={$themeStore}
    >
        {#each THEMES as t (t.id)}
            <option value={t.id}>{t.label}</option>
        {/each}
    </select>
</div>

<style lang="scss">
  @import "./ThemeSwitcher.scss";
</style>
