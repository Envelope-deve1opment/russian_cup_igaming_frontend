import type {LobbyItemDto} from "$lib/api/dto";
import {getMockRoomGameId} from "$lib/constants/roomGame";
import {RoomStatus} from "$lib/constants/roomStatusType";
import type {Room} from "$lib/types";

export function mapLobbyItemToRoom(dto: LobbyItemDto): Room {
    return {
        id: dto.templateId,
        gameId: getMockRoomGameId(dto.templateId, dto.templateName), // Нет gameType в API
        name: dto.templateName,
        entryPrice: dto.entryFee,
        commission: undefined, // Нет commission в API
        maxSeats: dto.participantsCount,
        prizeFund: dto.entryFee * dto.participantsCount,
        boostEnabled: dto.boostEnabled,
        boostCost: dto.boostCost,
        seatsTaken: dto.waitingPlayersCount,
        participants: [],
        seatDecorations: [],
        status: RoomStatus.WAITING
    };
}
