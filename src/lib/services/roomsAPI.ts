import type {Room} from "$lib/types";
import {createInitialMockRooms} from "./mockRoomsFactory";

// Загрузка списка комнат. Сейчас — мок; позже заменить на `fetch("/api/rooms")`
export async function fetchRooms(): Promise<Room[]> {
    return Promise.resolve(createInitialMockRooms());
}
