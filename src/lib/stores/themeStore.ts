import {browser} from "$app/environment";
import {writable} from "svelte/store";

/** Ключ в localStorage (дублируется в app.html для раннего применения темы). */
export const THEME_STORAGE_KEY = "vip_igaming_theme";

export const THEMES = [
    {id: "vip-dark" as const, label: "VIP Night"},
    {id: "vip-gold" as const, label: "VIP Gold"},
    {id: "midnight-blue" as const, label: "Midnight Blue"},
    {id: "vip-light" as const, label: "VIP Day"}
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

function isThemeId(x: string): x is ThemeId {
    return THEMES.some((t) => t.id === x);
}

function readInitial(): ThemeId {
    if (!browser) {
        return "vip-dark";
    }

    try {
        const s = localStorage.getItem(THEME_STORAGE_KEY);

        if (s && isThemeId(s)) {
            return s;
        }
    } catch {
        /* storage недоступен */
    }

    return "vip-dark";
}

export const themeStore = writable<ThemeId>(readInitial());

export function setTheme(id: ThemeId): void {
    themeStore.set(id);
}
