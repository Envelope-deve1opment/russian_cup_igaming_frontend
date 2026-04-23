import {writable} from "svelte/store";
import {roomsStore} from "./roomsStore";
import type {RoomDetailsDto} from "$lib/api/dto";
import {roomService} from "$lib/api/roomService";

export const currentRoomStore = writable<RoomDetailsDto | null>(null);

// Выбранный id комнаты для синхронизации с roomsStore (null — не следим)
let subscribedId: string | null = null;
let unsub: (() => void) | null = null;

function attachSync(roomId: string): void {
    if (subscribedId === roomId && unsub) return;

    detachSync();
    subscribedId = roomId;

    unsub = roomsStore.subscribe(async () => {
        try {
            currentRoomStore.set(await roomService.getDetails(roomId));
        } catch (e) {
            currentRoomStore.set(null);
        }
    });
}

function detachSync(): void {
    unsub?.();
    unsub = null;
    subscribedId = null;
}

// Установить текущую комнату по id и подписаться на обновления списка
export async function setCurrentRoomId(id: string | null): Promise<void> {
    if (id == null) {
        detachSync();
        currentRoomStore.set(null);
        return;
    }

    attachSync(id);

    currentRoomStore.set(await roomService.getDetails(id));
}
