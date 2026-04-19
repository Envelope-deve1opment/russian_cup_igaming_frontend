import {writable} from "svelte/store";
import type {RoundHistoryEntry} from "$lib/types";

export const gameLogStore = writable<RoundHistoryEntry[]>([]);

export function appendRound(entry: RoundHistoryEntry): void {
    gameLogStore.update((log) => [entry, ...log]);
}
