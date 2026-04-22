import type {RoomDetailsDto, RoomListItemDto, RoomParticipantDto} from "$lib/api/dto";
import {RoomStatus, type RoomStatus as RoomStatusType} from "$lib/constants/roomStatus";
import type {Participant, Room} from "$lib/types";

function mapStatus(raw: string): RoomStatusType {
    const value = raw.toLowerCase();
    if (value === RoomStatus.Starting) return RoomStatus.Starting;
    if (value === RoomStatus.Active) return RoomStatus.Active;
    if (value === RoomStatus.Finished) return RoomStatus.Finished;
    return RoomStatus.Waiting;
}

function calcTimerEndsAt(countdownStartedAt?: string, countdownSeconds?: number): number | undefined {
    if (!countdownStartedAt || countdownSeconds == null) {
        return undefined;
    }
    const startedAt = new Date(countdownStartedAt).getTime();
    if (Number.isNaN(startedAt)) {
        return undefined;
    }
    return startedAt + countdownSeconds * 1000;
}

export function mapParticipantDto(dto: RoomParticipantDto, currentUserId?: string): Participant {
    const isCurrentUser = currentUserId != null && dto.userId === currentUserId;
    const status = dto.status?.toLowerCase() ?? "";
    return {
        id: dto.userId,
        name: dto.bot ? `Bot ${dto.seatNum + 1}` : `Player ${dto.seatNum + 1}`,
        seatNum: dto.seatNum,
        isBot: dto.bot,
        isCurrentUser,
        hasBoost: status.includes("boost")
    };
}

export function mapRoomListItem(dto: RoomListItemDto): Room {
    return {
        id: dto.roomId,
        name: dto.templateName,
        entryPrice: dto.entryFee,
        maxSeats: dto.participantsLimit,
        prizeFund: dto.entryFee * dto.participantsLimit,
        boostEnabled: dto.boostEnabled,
        boostCost: dto.boostCost,
        seatsTaken: dto.occupiedSeatsCount,
        participants: [],
        status: mapStatus(dto.status),
        timerEndsAt: calcTimerEndsAt(dto.countdownStartedAt, dto.countdownSeconds)
    };
}

export function mapRoomDetails(dto: RoomDetailsDto, currentUserId?: string): Room {
    const participants = [...dto.seats]
        .sort((a, b) => a.seatNum - b.seatNum)
        .map((seat) => mapParticipantDto(seat, currentUserId));

    console.log(123, dto)
    return {
        id: dto.id,
        name: dto.templateName,
        entryPrice: dto.entryFee,
        maxSeats: dto.participantsLimit,
        prizeFund: dto.entryFee * dto.participantsLimit,
        boostEnabled: dto.boostEnabled ?? false,
        boostCost: dto.boostCost,
        seatsTaken: dto.occupiedSeatsCount,
        participants,
        status: mapStatus(dto.status),
        timerEndsAt: calcTimerEndsAt(dto.countdownStartedAt, dto.countdownSeconds)
    };
}
