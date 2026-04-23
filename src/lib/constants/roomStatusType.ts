// Жизненный цикл комнаты (согласован с API)
export const RoomStatus = {
    WAITING: "WAITING",
    COUNTDOWN: "COUNTDOWN",
    STARTING: "STARTING",
    ACTIVE: "ACTIVE",
    FINISHED: "FINISHED"
} as const;

export type RoomStatusType = (typeof RoomStatus)[keyof typeof RoomStatus];

export const ROOM_STATUS_LABEL: Record<RoomStatusType, string> = {
    [RoomStatus.WAITING]: "Ожидание",
    [RoomStatus.COUNTDOWN]: "Отсчёт",
    [RoomStatus.STARTING]: "Старт",
    [RoomStatus.ACTIVE]: "Раунд",
    [RoomStatus.FINISHED]: "Итог"
} as const;
