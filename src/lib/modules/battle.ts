export type BattleFaction = {
    id: string;
    place: number;
    title: string;
    codename: string;
    accent: string;
    accentSoft: string;
};

export type BattleEvent = {
    timeMs: number;
    attackerId: string;
    targetId: string;
    kills: number;
    label: string;
    snapshot: Record<string, number>;
    attackerCount: number;
    targetCount: number;
    eliminated: boolean;
};

export type BattleScenario = {
    winnerPlace: number;
    winnerId: string;
    factions: BattleFaction[];
    initialCounts: Record<string, number>;
    events: BattleEvent[];
    durationMs: number;
};

export type BattleViewState = {
    counts: Record<string, number>;
    currentEvent: BattleEvent | null;
    completedEvents: number;
};

const FACTIONS: BattleFaction[] = [
    {id: "place-2", place: 2, title: "Место 2", codename: "Glass Jackals", accent: "#ff9d57", accentSoft: "rgba(255,157,87,0.2)"},
    {id: "place-3", place: 3, title: "Место 3", codename: "North Halo", accent: "#61d0ff", accentSoft: "rgba(97,208,255,0.2)"},
    {id: "place-4", place: 4, title: "Место 4", codename: "Ash Comets", accent: "#d084ff", accentSoft: "rgba(208,132,255,0.2)"},
    {id: "place-5", place: 5, title: "Место 5", codename: "Steel Vipers", accent: "#80f0b6", accentSoft: "rgba(128,240,182,0.2)"},
    {id: "place-6", place: 6, title: "Место 6", codename: "Rift Wolves", accent: "#ffd36e", accentSoft: "rgba(255,211,110,0.2)"},
    {id: "place-7", place: 7, title: "Место 7", codename: "Delta Shade", accent: "#ff739f", accentSoft: "rgba(255,115,159,0.2)"},
    {id: "place-8", place: 8, title: "Место 8", codename: "Ion Lance", accent: "#7cf1ff", accentSoft: "rgba(124,241,255,0.2)"},
    {id: "place-9", place: 9, title: "Место 9", codename: "Frost Aegis", accent: "#8a98ff", accentSoft: "rgba(138,152,255,0.2)"},
    {id: "place-10", place: 10, title: "Место 10", codename: "Scarlet Orbit", accent: "#ff8b6b", accentSoft: "rgba(255,139,107,0.2)"}
];

const ATTACK_LABELS: string[] = [
    "прошил очередь",
    "выбил укрытие",
    "накрыл залпом",
    "срезал фланг",
    "поймал в прицел",
    "разорвал строй"
];

type Rng = () => number;

function createRng(seed: number): Rng {
    let state = seed >>> 0;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function randomInt(rng: Rng, min: number, max: number): number {
    return Math.floor(min + rng() * (max - min + 1));
}

function pickWeighted<T>(rng: Rng, items: T[], getWeight: (item: T) => number): T {
    const total = items.reduce((sum, item) => sum + getWeight(item), 0);
    let cursor = rng() * total;

    for (const item of items) {
        cursor -= getWeight(item);
        if (cursor <= 0) {
            return item;
        }
    }

    return items[items.length - 1];
}

function cloneCounts(counts: Record<string, number>): Record<string, number> {
    return Object.fromEntries(Object.entries(counts));
}

export function getBattleFactions(): BattleFaction[] {
    return FACTIONS;
}

export function generateBattleScenario(winnerPlace: number, generation: number): BattleScenario {
    const winnerFaction = FACTIONS.find((faction) => faction.place === winnerPlace) ?? FACTIONS[0];
    const seed = (generation + 1) * 1103515245 + winnerFaction.place * 8191;
    const rng = createRng(seed);
    const counts: Record<string, number> = {};

    for (const faction of FACTIONS) {
        counts[faction.id] = randomInt(rng, 6, 10) + (faction.id === winnerFaction.id ? 2 : 0);
    }

    const initialCounts = cloneCounts(counts);
    const events: BattleEvent[] = [];
    let timeMs = 0;

    while (Object.values(counts).filter((count) => count > 0).length > 1 && events.length < 120) {
        const alive = FACTIONS.filter((faction) => counts[faction.id] > 0);
        const attacker = pickWeighted(rng, alive, (faction) => (faction.id === winnerFaction.id ? 1.24 : 1));
        const targets = alive.filter((faction) => faction.id !== attacker.id);
        const target = pickWeighted(rng, targets, (faction) => {
            if (faction.id === winnerFaction.id) {
                return alive.length > 3 ? 0.42 : 0.8;
            }
            return 1 + counts[faction.id] * 0.04;
        });

        let kills = randomInt(rng, 1, 3);
        if (attacker.id === winnerFaction.id && rng() > 0.58) {
            kills += 1;
        }

        if (target.id === winnerFaction.id && alive.length > 2) {
            kills = Math.min(kills, Math.max(1, counts[target.id] - 2));
        }

        if (alive.length === 2 && attacker.id === winnerFaction.id && target.id !== winnerFaction.id) {
            kills = counts[target.id];
        }

        kills = Math.min(kills, counts[target.id]);
        counts[target.id] -= kills;
        timeMs += randomInt(rng, 320, 620);

        events.push({
            timeMs,
            attackerId: attacker.id,
            targetId: target.id,
            kills,
            label: ATTACK_LABELS[randomInt(rng, 0, ATTACK_LABELS.length - 1)],
            snapshot: cloneCounts(counts),
            attackerCount: counts[attacker.id],
            targetCount: counts[target.id],
            eliminated: counts[target.id] === 0
        });
    }

    const durationMs = (events.at(-1)?.timeMs ?? 0) + 1800;

    return {
        winnerPlace: winnerFaction.place,
        winnerId: winnerFaction.id,
        factions: FACTIONS,
        initialCounts,
        events,
        durationMs
    };
}

export function getBattleViewState(scenario: BattleScenario, elapsedMs: number): BattleViewState {
    let currentEvent: BattleEvent | null = null;
    let completedEvents = 0;

    for (const event of scenario.events) {
        if (event.timeMs > elapsedMs) {
            break;
        }
        currentEvent = event;
        completedEvents += 1;
    }

    return {
        counts: currentEvent?.snapshot ?? scenario.initialCounts,
        currentEvent,
        completedEvents
    };
}
