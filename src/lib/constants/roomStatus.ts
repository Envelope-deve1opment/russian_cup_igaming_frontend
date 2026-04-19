// Жизненный цикл комнаты (согласован с будущим API)
export const RoomStatus = {
    Waiting: "waiting",
    Starting: "starting",
    Active: "active",
    Finished: "finished"
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
    [RoomStatus.Waiting]: "Ожидание",
    [RoomStatus.Starting]: "Старт",
    [RoomStatus.Active]: "Раунд",
    [RoomStatus.Finished]: "Итог"
} as const;
