import type {RoomStatus} from "$lib/constants/roomStatus";

// ПРЕДВАРИТЕЛЬНЫЕ ТИПЫ, ВРЕМЕННЫЕ ЗАГЛУШКИ (РЕАЛЬНЫХ DTO ЕЩЁ НЕТ)
export type Participant = {
    id: string;
    name: string;
    seatNum?: number;
    isBot: boolean;
    isVisualOnly?: boolean;
    isCurrentUser?: boolean;
    hasBoost?: boolean;
};

export type Room = {
    id: string;
    name: string;
    entryPrice: number;
    maxSeats: number;
    prizeFund: number;
    boostEnabled: boolean;
    boostCost?: number;
    seatsTaken: number;
    participants: Participant[];
    seatDecorations: Participant[];
    status: RoomStatus;
    timerEndsAt?: number;
    winnerParticipantId?: string;
    roundResult?: RoundResult;
};

export type User = {
    id: string;
    name: string;
    role: "ADMIN" | "USER";
    bonusBalance: number;
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
