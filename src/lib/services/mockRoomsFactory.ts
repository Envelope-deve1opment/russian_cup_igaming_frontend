import {RoomStatus} from "$lib/constants/roomStatus";
import type {Participant, Room} from "$lib/types";

function bot(id: string, name: string): Participant {
    return {id, name, isBot: true, hasBoost: false};
}

function human(id: string, name: string, opts?: { hasBoost?: boolean }): Participant {
    return {id, name, isBot: false, hasBoost: opts?.hasBoost};
}

// Начальный набор комнат для мок‑прототипа (5–6 штук с разными параметрами)
export function createInitialMockRooms(): Room[] {
    const now: number = Date.now();
    const rooms: Room[] = [
        {
            id: "room-aurora",
            name: "Aurora Elite",
            entryPrice: 500,
            maxSeats: 6,
            prizeFund: 2400,
            boostEnabled: true,
            boostCost: 150,
            seatsTaken: 3,
            participants: [
                human("p-1", "Alex", {hasBoost: true}),
                bot("b-1", "Bot·Vega"),
                bot("b-2", "Bot·Orion")
            ],
            status: RoomStatus.Waiting,
            timerEndsAt: now + 18_000
        },
        {
            id: "room-nova",
            name: "Nova Rush",
            entryPrice: 1200,
            maxSeats: 8,
            prizeFund: 8200,
            boostEnabled: true,
            boostCost: 400,
            seatsTaken: 5,
            participants: [
                human("p-2", "Mira"),
                bot("b-3", "Bot·Atlas"),
                bot("b-4", "Bot·Lyra"),
                bot("b-5", "Bot·Draco"),
                bot("b-6", "Bot·Sol")
            ],
            status: RoomStatus.Waiting,
            timerEndsAt: now + 42_000
        },
        {
            id: "room-pulse",
            name: "Pulse Mini",
            entryPrice: 200,
            maxSeats: 4,
            prizeFund: 720,
            boostEnabled: false,
            seatsTaken: 2,
            participants: [bot("b-7", "Bot·Echo"), bot("b-8", "Bot·Nova")],
            status: RoomStatus.Waiting,
            timerEndsAt: now + 55_000
        },
        {
            id: "room-apex",
            name: "Apex Highroller",
            entryPrice: 5000,
            maxSeats: 10,
            prizeFund: 42_000,
            boostEnabled: true,
            boostCost: 1200,
            seatsTaken: 4,
            participants: [
                human("p-3", "Dmitry"),
                bot("b-9", "Bot·Titan"),
                bot("b-10", "Bot·Nexus"),
                bot("b-11", "Bot·Prime")
            ],
            status: RoomStatus.Waiting,
            timerEndsAt: now + 70_000
        },
        {
            id: "room-solo",
            name: "Duo Strike",
            entryPrice: 800,
            maxSeats: 2,
            prizeFund: 1400,
            boostEnabled: true,
            boostCost: 200,
            seatsTaken: 1,
            participants: [bot("b-12", "Bot·Rush")],
            status: RoomStatus.Waiting,
            timerEndsAt: now + 12_000
        },
        {
            id: "room-quartz",
            name: "Quartz Lounge",
            entryPrice: 2500,
            maxSeats: 6,
            prizeFund: 13_500,
            boostEnabled: false,
            boostCost: undefined,
            seatsTaken: 2,
            participants: [human("p-4", "Elena"), bot("b-13", "Bot·Quartz")],
            status: RoomStatus.Waiting,
            timerEndsAt: now + 33_000
        }
    ];
    return rooms;
}
