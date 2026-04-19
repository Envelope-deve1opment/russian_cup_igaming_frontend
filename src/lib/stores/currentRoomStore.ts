import {get, writable} from "svelte/store";
import type {Room} from "$lib/types";
import {roomsStore} from "./roomsStore";

export const currentRoomStore = writable<Room | null>(null);

// Выбранный id комнаты для синхронизации с roomsStore (null — не следим)
let subscribedId: string | null = null;
let unsub: (() => void) | null = null;

function attachSync(roomId: string): void {
    if (subscribedId === roomId && unsub) return;

    detachSync();
    subscribedId = roomId;

    unsub = roomsStore.subscribe((list) => {
        const found = list.find((r) => r.id === roomId) ?? null;
        currentRoomStore.set(found);
    });
}

function detachSync(): void {
    unsub?.();
    unsub = null;
    subscribedId = null;
}

// Установить текущую комнату по id и подписаться на обновления списка
export function setCurrentRoomId(id: string | null): void {
    if (id == null) {
        detachSync();
        currentRoomStore.set(null);
        return;
    }

    attachSync(id);
    const list: Room[] = get(roomsStore);
    currentRoomStore.set(list.find((r) => r.id === id) ?? null);
}
