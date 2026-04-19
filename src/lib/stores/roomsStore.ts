import {writable} from "svelte/store";
import type {Participant, Room} from "$lib/types";

export const roomsStore = writable<Room[]>([]);

export function setRooms(rooms: Room[]): void {
    roomsStore.set(rooms);
}

export function updateRoom(id: string, patch: Partial<Room>): void {
    roomsStore.update((list: Room[]): Room[] =>
        list.map((r: Room): Room => {
            if (r.id !== id) return r;

            const participants: Participant[] = patch.participants !== undefined ? patch.participants : r.participants;
            const seatsTaken: number = patch.seatsTaken !== undefined ? patch.seatsTaken : participants.length;

            return {...r, ...patch, participants, seatsTaken};
        })
    );
}
