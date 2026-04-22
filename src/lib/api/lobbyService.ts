import {requestJSON} from "$lib/api/baseAPI";
import type {LobbyItemDto} from "$lib/api/dto";

export const lobbyService = {
    async getLobby(): Promise<LobbyItemDto[]> {
        return await requestJSON<LobbyItemDto[]>("/lobby");
    }
};
