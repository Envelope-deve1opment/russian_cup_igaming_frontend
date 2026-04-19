// Состояние слота места в лобби комнаты (data-state на карточке места)
export const SeatSlotState = {
    Free: "free",
    Bot: "bot",
    You: "you",
    Human: "human"
} as const;

export type SeatSlotState = (typeof SeatSlotState)[keyof typeof SeatSlotState];
