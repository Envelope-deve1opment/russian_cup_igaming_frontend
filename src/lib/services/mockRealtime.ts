import {RoomStatus} from "$lib/constants/roomStatus";
import {get} from "svelte/store";
import type {Participant, Room, RoundResult} from "$lib/types";
import {appendRound} from "$lib/stores/gameLogStore";
import {roomsStore, setRooms} from "$lib/stores/roomsStore";
import {fetchRooms} from "./roomsAPI";

let intervalID: ReturnType<typeof setInterval> | null = null;

const BOT_NAMES: string[] = [
    "Александр", "Василий", "Лёха", "Костян", "Сергей", "Володя", "Марина", "Маша", "Кристина", "Елена",
    "Сан Саныч", "Иван Иванович"
] as const;

function randomBotName(): string {
    return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] ?? "Bot";
}

// Лёгкая имитация заполнения: боты приходят/уходят, не нарушая вместимость
function tweakParticipants(room: Room): Participant[] {
    if (room.status !== RoomStatus.Waiting && room.status !== RoomStatus.Starting) {
        return room.participants;
    }

    const cap: number = room.maxSeats;
    let next: Participant[] = [...room.participants];
    const bots: Participant[] = next.filter((p: Participant): boolean => p.isBot);
    const humans: Participant[] = next.filter((p: Participant): boolean => !p.isBot);

    if (next.length < cap && Math.random() < 0.28) {
        const id = `bot-${room.id}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

        next = [...next, {id, name: `Bot·${randomBotName()}`, isBot: true, hasBoost: false}];
    } else if (bots.length > 0 && next.length > humans.length && Math.random() < 0.18) {
        const victim: Participant = bots[Math.floor(Math.random() * bots.length)];

        next = next.filter((p: Participant): boolean => p.id !== victim?.id);
    }
    return next;
}

function transition(room: Room, now: number): Room {
    switch (room.status) {
        case RoomStatus.Waiting:
            return {
                ...room,
                status: RoomStatus.Starting,
                timerEndsAt: now + 3000,
                participants: room.participants,
                seatsTaken: room.participants.length
            };
        case RoomStatus.Starting:
            return {
                ...room,
                status: RoomStatus.Active,
                timerEndsAt: now + 2000,
                participants: room.participants,
                seatsTaken: room.participants.length
            };
        case RoomStatus.Active: {
            const parts: Participant[] = room.participants;
            const idx: number = Math.max(0, Math.min(parts.length - 1, Math.floor(Math.random() * parts.length)));
            const winner: Participant = parts[idx] ?? parts[0];
            const winnerID: string = winner?.id ?? "unknown";
            const result: RoundResult = {
                winnerID,
                prizeAmount: Math.round(room.prizeFund * 0.88),
                participants: parts.map((p: Participant): Participant => ({...p}))
            };

            appendRound({
                id: `round-${room.id}-${now}`,
                roomId: room.id,
                roomName: room.name,
                finishedAt: now,
                result
            });

            return {
                ...room,
                status: RoomStatus.Finished,
                timerEndsAt: now + 7000,
                participants: result.participants,
                seatsTaken: result.participants.length
            };
        }
        case RoomStatus.Finished: {
            const botCount: number = 1 + Math.floor(Math.random() * 3);
            const freshBots: Participant[] = [];

            for (let i = 0; i < botCount; i++) {
                freshBots.push({
                    id: `bot-${room.id}-r-${now}-${i}`,
                    name: `Bot·${randomBotName()}`,
                    isBot: true,
                    hasBoost: false
                });
            }

            const delay: number = 12000 + Math.floor(Math.random() * 38000);

            return {
                ...room,
                status: RoomStatus.Waiting,
                participants: freshBots,
                seatsTaken: freshBots.length,
                timerEndsAt: now + delay
            };
        }
        default:
            return room;
    }
}

function tickRoom(room: Room, now: number): Room {
    const endsAt: number = room.timerEndsAt ?? now;

    if (now < endsAt) {
        const participants: Participant[] = tweakParticipants({...room, participants: room.participants});
        return {...room, participants, seatsTaken: participants.length};
    }

    return transition(room, now);
}

// Запуск периодического обновления комнат (1 cек). Идемпотентен: перед стартом сбрасывает предыдущий интервал
// Если `roomsStore` пуст — подгружает мок через `fetchRooms()` (в будущем — тот же контракт, что и API)
export async function startMockUpdates(): Promise<void> {
    stopMockUpdates();
    if (get(roomsStore).length === 0) {
        const rooms: Room[] = await fetchRooms();
        setRooms(rooms);
    }
    intervalID = setInterval((): void => {
        const now: number = Date.now();
        roomsStore.update((list) => list.map((r) => tickRoom(r, now)));
    }, 1000);
}

// Остановка эмуляции (вызывать из `onDestroy` корневого layout)
export function stopMockUpdates(): void {
    if (intervalID != null) {
        clearInterval(intervalID);
        intervalID = null;
    }
}
