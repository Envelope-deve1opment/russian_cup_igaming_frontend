import {browser} from "$app/environment";
import {roomService} from "$lib/api/roomService";
import {AUTH_SESSION_TOKEN_KEY} from "$lib/constants/authStorage";
import {setRooms, updateRoom} from "$lib/stores/roomsStore";
import {get} from "svelte/store";
import {userStore} from "$lib/stores/userStore";
import {mapRoomDetails, mapRoomListItem} from "$lib/services/roomMappers";

let lobbyAbortController: AbortController | null = null;
let roomAbortController: AbortController | null = null;
let subscribedRoomId: string | null = null;
const apiBaseURL = (import.meta.env.PUBLIC_API_URL as string | undefined)?.trim() || "http://localhost:8080/api";

function getAuthToken(): string | null {
    if (!browser) {
        return null;
    }
    return sessionStorage.getItem(AUTH_SESSION_TOKEN_KEY);
}

function buildSseHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "text/event-stream"
    };
    const token = getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function openSseStream(path: string, signal: AbortSignal, onEvent: () => void): Promise<void> {
    const response = await fetch(`${apiBaseURL}${path}`, {
        method: "GET",
        headers: buildSseHeaders(),
        credentials: "include",
        signal
    });
    if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (!signal.aborted) {
        const {value, done} = await reader.read();
        if (done) {
            break;
        }
        buffer += decoder.decode(value, {stream: true});
        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
            const eventChunk = buffer.slice(0, boundaryIndex).trim();
            buffer = buffer.slice(boundaryIndex + 2);
            if (eventChunk) {
                onEvent();
            }
            boundaryIndex = buffer.indexOf("\n\n");
        }
    }
}

function startSseLoop(path: string, setController: (controller: AbortController | null) => void, onEvent: () => void): void {
    const controller = new AbortController();
    setController(controller);
    const run = async (): Promise<void> => {
        while (!controller.signal.aborted) {
            try {
                await openSseStream(path, controller.signal, onEvent);
            } catch {
                if (!controller.signal.aborted) {
                    onEvent();
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }
            }
        }
    };
    void run();
}

async function refreshLobby(): Promise<void> {
    const rooms = await roomService.getActiveRooms();
    setRooms(rooms.map(mapRoomListItem));
}

export async function startRoomsRealtime(): Promise<void> {
    if (!browser) return;
    await refreshLobby();

    lobbyAbortController?.abort();
    startSseLoop("/lobby/events", (controller) => {
        lobbyAbortController = controller;
    }, () => {
        void refreshLobby();
    });
}

export function stopRoomsRealtime(): void {
    lobbyAbortController?.abort();
    lobbyAbortController = null;
    stopCurrentRoomRealtime();
}

async function refreshRoom(roomId: string): Promise<void> {
    const dto = await roomService.getDetails(roomId);
    const currentUserId = get(userStore).id;
    updateRoom(roomId, mapRoomDetails(dto, currentUserId));
}

export function stopCurrentRoomRealtime(): void {
    roomAbortController?.abort();
    roomAbortController = null;
    subscribedRoomId = null;
}

export async function watchCurrentRoom(roomId: string): Promise<void> {
    if (!browser) return;
    if (subscribedRoomId === roomId && roomAbortController) return;
    stopCurrentRoomRealtime();
    subscribedRoomId = roomId;
    await refreshRoom(roomId);

    startSseLoop(`/room/events/${roomId}`, (controller) => {
        roomAbortController = controller;
    }, () => {
        void refreshRoom(roomId);
    });
}

export async function refreshCurrentRoom(roomId: string): Promise<void> {
    await refreshRoom(roomId);
}
