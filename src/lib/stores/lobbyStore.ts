import {writable} from "svelte/store";
import type {LobbyItemDto} from "$lib/api/dto";

export const lobbyStore = writable<LobbyItemDto[]>([]);

export function setLobbyItems(items: LobbyItemDto[]): void {
    lobbyStore.set(items);
}