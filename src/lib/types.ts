import type {RoomStatusType} from "$lib/constants/roomStatusType";
import type {RoomGameId} from "$lib/constants/roomGame";

// ПРЕДВАРИТЕЛЬНЫЕ ТИПЫ, ВРЕМЕННЫЕ ЗАГЛУШКИ (РЕАЛЬНЫХ DTO ЕЩЁ НЕТ)
export type Participant = {
    id: string;
    participantId?: string;
    name: string;
    seatNum?: number;
    weight?: number;
    isBot: boolean;
    isVisualOnly?: boolean;
    isCurrentUser?: boolean;
    hasBoost?: boolean;
};

export type Room = {
    id: string;
    gameId: RoomGameId;
    name: string;
    entryPrice: number;
    commission?: number;
    maxSeats: number;
    prizeFund: number;
    boostEnabled: boolean;
    boostCost?: number;
    seatsTaken: number;
    participants: Participant[];
    seatDecorations: Participant[];
    status: RoomStatusType;
    timerEndsAt?: number;
    winnerParticipantId?: string;
    roundResult?: RoundResult;
};

export type User = {
    id: string;
    name: string;
    role: "ADMIN" | "USER";
    bonusBalance: number;
    reservedAmount: number;
};

/** Ответ после авторизации и получения текущего пользователя. */
export type AuthLoginResponse = {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
};

export type RoundResult = {
    winnerID: string;
    prizeAmount: number;
    participants: Participant[];
};

// Запись журнала завершённых раундов (клиентский прототип до появления DTO API)
export type RoundHistoryEntry = {
    id: string;
    roomId: string;
    roomName: string;
    finishedAt: number;
    result: RoundResult;
};
