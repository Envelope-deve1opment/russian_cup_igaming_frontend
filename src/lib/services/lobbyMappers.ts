import type {LobbyItemDto} from "$lib/api/dto";
import {getMockRoomGameId} from "$lib/constants/roomGame";
import type {Room} from "$lib/types";
import {RoomStatus} from "$lib/constants/roomStatus";

export function mapLobbyItemToRoom(dto: LobbyItemDto): Room {
    return {
        id: dto.templateId,
        gameId: getMockRoomGameId(dto.templateId, dto.templateName),
        name: dto.templateName,
        entryPrice: dto.entryFee,
        maxSeats: dto.participantsCount,
        prizeFund: dto.entryFee * dto.participantsCount,
        boostEnabled: dto.boostEnabled,
        boostCost: dto.boostCost,
        seatsTaken: dto.waitingPlayersCount,
        participants: [],
        seatDecorations: [],
        status: RoomStatus.Waiting
    };
}
