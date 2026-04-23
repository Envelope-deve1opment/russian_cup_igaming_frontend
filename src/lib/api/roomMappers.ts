import type {RoomDetailsDto, RoomListItemDto, RoomParticipantDto} from "$lib/api/dto";
import {RoomStatus, type RoomStatusType} from "$lib/constants/roomStatusType";
import type {Participant, Room, RoundResult} from "$lib/types";

function mapStatus(raw: string): RoomStatusType {
    const value = raw.toLowerCase();
    if (value === RoomStatus.STARTING) return RoomStatus.STARTING;
    if (value === RoomStatus.ACTIVE) return RoomStatus.ACTIVE;
    if (value === RoomStatus.FINISHED) return RoomStatus.FINISHED;
    return RoomStatus.WAITING;
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

function isReleasedSeat(dto: RoomParticipantDto): boolean {
    const status = dto.status?.toLowerCase() ?? "";

    if (dto.leftAt) {
        return true;
    }

    return status.includes("left") || status.includes("leave") || status.includes("release");
}

function toParticipantName(dto: RoomParticipantDto): string {
    return dto.bot ? `Bot ${dto.seatNum + 1}` : `Player ${dto.seatNum + 1}`;
}

function asFiniteNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function resolveWinnerUserId(rawWinnerId: string | undefined, participants: Participant[]): string | undefined {
    if (!rawWinnerId) {
        return undefined;
    }

    const byParticipantId = participants.find((participant) => participant.participantId === rawWinnerId);
    if (byParticipantId) {
        return byParticipantId.id;
    }

    const byUserId = participants.find((participant) => participant.id === rawWinnerId);
    if (byUserId) {
        return byUserId.id;
    }

    return rawWinnerId;
}

function mapResultParticipant(raw: unknown, currentUserId?: string): Participant | null {
    if (typeof raw !== "object" || raw == null) {
        return null;
    }

    const record = raw as Record<string, unknown>;
    const userId = asString(record.userId) ?? asString(record.id);
    const seatNum = asFiniteNumber(record.seatNum);
    const bot = record.bot === true;

    if (!userId) {
        return null;
    }

    return {
        id: userId,
        participantId: asString(record.participantId) ?? asString(record.id),
        name: asString(record.name) ?? toParticipantName({
            id: userId,
            roomId: "",
            userId,
            bot,
            seatNum: seatNum ?? 0
        }),
        seatNum,
        weight: asFiniteNumber(record.weightSnapshot) ?? asFiniteNumber(record.weight) ?? 1,
        isBot: bot,
        isVisualOnly: false,
        isCurrentUser: currentUserId != null && userId === currentUserId,
        hasBoost: false
    };
}

function mapRoomResult(dto: RoomDetailsDto, participants: Participant[], currentUserId?: string): RoundResult | undefined {
    const payload = dto.resultPayloadJson;
    const payloadWinnerIdRaw = payload == null
        ? undefined
        : asString(payload.winnerID) ?? asString(payload.winnerId) ?? asString(payload.winnerParticipantId);
    const winnerID = resolveWinnerUserId(payloadWinnerIdRaw ?? dto.winnerParticipantId, participants);

    if (!winnerID) {
        return undefined;
    }

    const payloadParticipants = Array.isArray(payload?.participants)
        ? payload.participants
            .map((entry) => mapResultParticipant(entry, currentUserId))
            .filter((entry): entry is Participant => entry != null)
        : [];

    return {
        winnerID,
        prizeAmount: asFiniteNumber(payload?.prizeAmount) ?? asFiniteNumber(payload?.prizeFund) ?? dto.entryFee * dto.participantsLimit,
        participants: payloadParticipants.length > 0 ? payloadParticipants : participants
    };
}

export function mapParticipantDto(dto: RoomParticipantDto, currentUserId?: string, options?: {
    visualOnly?: boolean
}): Participant {
    const isCurrentUser = currentUserId != null && dto.userId === currentUserId;
    const status = dto.status?.toLowerCase() ?? "";
    return {
        id: dto.userId,
        participantId: dto.id,
        name: toParticipantName(dto),
        seatNum: dto.seatNum,
        weight: dto.weightSnapshot ?? 1,
        isBot: dto.bot,
        isVisualOnly: options?.visualOnly ?? false,
        isCurrentUser,
        hasBoost: status.includes("boost")
    };
}

export function mapRoomListItem(dto: RoomListItemDto): Room {
    return {
        id: dto.roomId,
        gameId: dto.gameType, // Нет в API, используем значение по умолчанию
        name: dto.templateName,
        entryPrice: dto.entryFee,
        maxSeats: dto.participantsLimit,
        prizeFund: dto.entryFee * dto.participantsLimit,
        boostEnabled: dto.boostEnabled,
        boostCost: dto.boostCost,
        seatsTaken: dto.occupiedSeatsCount,
        participants: [],
        seatDecorations: [],
        status: mapStatus(dto.status),
        timerEndsAt: calcTimerEndsAt(dto.countdownStartedAt, dto.countdownSeconds)
    };
}

export function mapRoomDetails(dto: RoomDetailsDto, currentUserId?: string): Room {
    const activeSeats = dto.seats.filter((seat) => !isReleasedSeat(seat));
    const participants = [...activeSeats]
        .filter((seat) => !seat.bot)
        .sort((a, b) => a.seatNum - b.seatNum)
        .map((seat) => mapParticipantDto(seat, currentUserId));
    const seatDecorations = [...activeSeats]
        .filter((seat) => seat.bot)
        .sort((a, b) => a.seatNum - b.seatNum)
        .map((seat) => mapParticipantDto(seat, currentUserId, {visualOnly: true}));
    const roundResult = mapRoomResult(dto, participants, currentUserId);

    return {
        id: dto.id,
        gameId: dto.gameType,
        name: dto.templateName,
        entryPrice: dto.entryFee,
        maxSeats: dto.participantsLimit,
        prizeFund: dto.entryFee * dto.participantsLimit,
        boostEnabled: false, // Нет в API, используем false по умолчанию
        boostCost: undefined, // Нет в API
        seatsTaken: dto.occupiedSeatsCount,
        participants,
        seatDecorations,
        status: mapStatus(dto.status),
        timerEndsAt: calcTimerEndsAt(dto.countdownStartedAt, dto.countdownSeconds),
        winnerParticipantId: dto.winnerParticipantId,
        roundResult
    };
}
