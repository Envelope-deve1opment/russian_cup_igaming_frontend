import {browser} from "$app/environment";
import {roomService} from "$lib/api/roomService";
import {AUTH_SESSION_TOKEN_KEY} from "$lib/constants/authStorage";
import {setRooms, upsertRoom} from "$lib/stores/roomsStore";
import {get} from "svelte/store";
import {userStore} from "$lib/stores/userStore";
import {mapRoomDetails, mapRoomListItem} from "$lib/api/roomMappers";
import {lobbyService} from "$lib/api/lobbyService";
import {setLobbyItems} from "$lib/stores/lobbyStore";
import type {LobbyItemDto, RoomDetailsDto} from "$lib/api/dto";

async function refreshActiveRooms(): Promise<void> {
    const rooms = await roomService.getActiveRooms();
    setRooms(rooms.map(mapRoomListItem));
}

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

interface SseParsedData<T> {
    data: T;
}

async function openSseStream<T>(path: string, signal: AbortSignal, onData: (data: T) => void): Promise<void> {
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
                parseSseEvent<T>(eventChunk, onData);
            }
            boundaryIndex = buffer.indexOf("\n\n");
        }
    }
}

function parseSseEvent<T>(raw: string, onData: (data: T) => void): void {
    const lines = raw.split("\n");
    let dataStr = "";
    for (const line of lines) {
        if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
        }
    }
    if (dataStr) {
        try {
            const parsed = JSON.parse(dataStr);
            onData(parsed as T);
        } catch (e) {
            // ignore parse errors
        }
    }
}

function startSseLoop<T>(path: string, setController: (controller: AbortController | null) => void, onData: (data: T) => void): void {
    const controller = new AbortController();
    setController(controller);
    const run = async (): Promise<void> => {
        while (!controller.signal.aborted) {
            try {
                await openSseStream<T>(path, controller.signal, onData);
            } catch {
                if (!controller.signal.aborted) {
                    onData(null as unknown as T);
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }
            }
        }
    };
    void run();
}

async function refreshLobby(): Promise<void> {
    const items = await lobbyService.getLobby();
    setLobbyItems(items);
}

export async function startRoomsRealtime(): Promise<void> {
    if (!browser) return;
    await refreshLobby();
    await refreshActiveRooms();

    lobbyAbortController?.abort();
    startSseLoop<LobbyItemDto[]>("/lobby/events", (controller) => {
        lobbyAbortController = controller;
    }, (items) => {
        if (items && Array.isArray(items)) {
            setLobbyItems(items);
            void refreshActiveRooms();
        }
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
    upsertRoom(mapRoomDetails(dto, currentUserId));
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

    startSseLoop<RoomDetailsDto>(`/room/events/${roomId}`, (controller) => {
        roomAbortController = controller;
    }, (dto) => {
        if (dto) {
            void refreshRoom(roomId);
        }
    });
}

export async function refreshCurrentRoom(roomId: string): Promise<void> {
    await refreshRoom(roomId);
}
