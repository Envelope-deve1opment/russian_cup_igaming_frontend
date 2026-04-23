export const ROOM_GAME_IDS = ["WHEEL", "ROULETTE", "RACE", "BATTLE", "DYNAMITE"] as const;

export type RoomGameId = (typeof ROOM_GAME_IDS)[number];

export const ROOM_GAME_LABEL: Record<RoomGameId, string> = {
    WHEEL: "Колесо",
    ROULETTE: "Рулетка",
    RACE: "Гонки",
    BATTLE: "Битва",
    DYNAMITE: "Динамит"
};

function hashString(value: string): number {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }

    return Math.abs(hash);
}

export function getMockRoomGameId(roomId: string, seed?: string): RoomGameId {
    const source = `${roomId}:${seed ?? ""}`;
    return ROOM_GAME_IDS[hashString(source) % ROOM_GAME_IDS.length];
}
