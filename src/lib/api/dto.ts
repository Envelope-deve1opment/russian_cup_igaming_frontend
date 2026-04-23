import type {RoomGameId} from "$lib/constants";

export type MockLoginResponse = {
    token: string;
};

export type CurrentUserResponse = {
    userId: string;
    username: string;
};

export type TechnicalUserDto = {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
    userPrivilegeStatus?: "DEFAULT" | "VIP";
};

export type RoomTemplateCreateDto = {
    templateName: string;
};

export type RoomTemplateDto = {
    id: string;
    templateName: string;
    entryFee?: number;
    commissionPercentage?: number;
    gameType?: RoomGameId;
    participantsCount?: number;
    active?: boolean;
    boostEnabled?: boolean;
    boostCost?: number;
    countdownSeconds?: number;
    createdAt?: string;
    updatedAt?: string;
};

export type LobbyItemDto = {
    templateId: string;
    templateName: string;
    entryFee: number;
    participantsCount: number;
    boostEnabled: boolean;
    boostCost?: number;
    countdownSeconds: number;
    activeRoomsCount: number;
    joinableRoomsCount: number;
    waitingPlayersCount: number;
};

export type RoomListItemDto = {
    roomId: string;
    templateId: string;
    templateName: string;
    entryFee: number;
    gameType: RoomGameId;
    participantsLimit: number;
    occupiedSeatsCount: number;
    status: string;
    countdownStartedAt?: string;
    countdownSeconds?: number;
    boostEnabled: boolean;
    boostCost?: number;
};

export type RoomParticipantDto = {
    id: string;
    roomId: string;
    userId: string;
    bot: boolean;
    weightSnapshot?: number;
    status?: string;
    seatNum: number;
    joinedAt?: string;
    leftAt?: string;
};

export type RoomDetailsDto = {
    id: string;
    templateId: string;
    templateName: string;
    entryFee: number;
    participantsLimit: number;
    occupiedSeatsCount: number;
    status: string;
    gameType: RoomGameId;
    countdownStartedAt?: string;
    countdownSeconds?: number;
    boostEnabled?: boolean;
    boostCost?: number;
    winnerParticipantId?: string;
    resultPayloadJson?: Record<string, unknown>;
    seats: RoomParticipantDto[];
};

export type RoomDto = {
    id: string;
    templateId: string;
    participantsLimit: number;
    activeParticipants: number;
    status: string;
};

export type BoostStateDto = {
    roomId: string;
    userId: string;
    boostApplied: boolean;
};
