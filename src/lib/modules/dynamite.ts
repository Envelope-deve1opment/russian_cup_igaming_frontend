export type DynamiteFaction = {
    id: string;
    place: number;
    codename: string;
    accent: string;
    accentSoft: string;
};

export type BombSegment = {
    fromId: string;
    toId: string;
    startMs: number;
    endMs: number;
};

export type BombPlan = {
    id: string;
    accent: string;
    accentSoft: string;
    startMs: number;
    explosionMs: number;
    targetId: string;
    finalHolderId: string;
    segments: BombSegment[];
};

export type ExplosionEvent = {
    bombId: string;
    timeMs: number;
    targetId: string;
    remainingSlots: number;
};

export type ActiveBombState = {
    id: string;
    mode: "flight" | "armed";
    accent: string;
    accentSoft: string;
    targetId: string;
    fromId?: string;
    toId?: string;
    holderId?: string;
    progress: number;
    countdownMs: number;
};

export type RecentExplosionState = {
    bombId: string;
    targetId: string;
    progress: number;
};

export type DynamiteScenario = {
    winnerPlace: number;
    winnerId: string;
    factions: DynamiteFaction[];
    initialSlots: number;
    initialCounts: Record<string, number>;
    bombs: BombPlan[];
    explosions: ExplosionEvent[];
    durationMs: number;
};

export type DynamiteViewState = {
    counts: Record<string, number>;
    activeBombs: ActiveBombState[];
    recentExplosions: RecentExplosionState[];
    completedExplosions: number;
    lastExplosion: ExplosionEvent | null;
};

const INITIAL_SLOTS = 3;
const BOMB_POOL = 3;
const EXPLOSION_FLASH_MS = 540;

const FACTIONS: DynamiteFaction[] = [
    {id: "place-2", place: 2, codename: "Fuse Nomads", accent: "#ffab5e", accentSoft: "rgba(255,171,94,0.22)"},
    {id: "place-3", place: 3, codename: "Blue Quarry", accent: "#64d8ff", accentSoft: "rgba(100,216,255,0.22)"},
    {id: "place-4", place: 4, codename: "Magma Shift", accent: "#ff6f6f", accentSoft: "rgba(255,111,111,0.22)"},
    {id: "place-5", place: 5, codename: "Prism Haze", accent: "#d084ff", accentSoft: "rgba(208,132,255,0.22)"},
    {id: "place-6", place: 6, codename: "Static Vale", accent: "#7cf2df", accentSoft: "rgba(124,242,223,0.22)"},
    {id: "place-7", place: 7, codename: "Ash Harbor", accent: "#ffd46d", accentSoft: "rgba(255,212,109,0.22)"},
    {id: "place-8", place: 8, codename: "Velvet Coil", accent: "#ff7db8", accentSoft: "rgba(255,125,184,0.22)"},
    {id: "place-9", place: 9, codename: "Frost Circuit", accent: "#8da7ff", accentSoft: "rgba(141,167,255,0.22)"},
    {id: "place-10", place: 10, codename: "Copper Dune", accent: "#ff8e69", accentSoft: "rgba(255,142,105,0.22)"}
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

function pickWeighted<T>(rng: Rng, items: T[], weightOf: (item: T) => number): T {
    const total = items.reduce((sum, item) => sum + weightOf(item), 0);
    let cursor = rng() * total;

    for (const item of items) {
        cursor -= weightOf(item);
        if (cursor <= 0) {
            return item;
        }
    }

    return items[items.length - 1];
}

function cloneCounts(counts: Record<string, number>): Record<string, number> {
    return Object.fromEntries(Object.entries(counts));
}

export function getDynamiteFactions(): DynamiteFaction[] {
    return FACTIONS;
}

function buildBombPlan(
    rng: Rng,
    bombIndex: number,
    availableAt: number,
    aliveIds: string[],
    targetId: string,
    bombSerial: number
): BombPlan {
    const bombAccent = ["#ffb35c", "#ff7399", "#74e5ff"][bombIndex % BOMB_POOL];
    const bombSoft = ["rgba(255,179,92,0.24)", "rgba(255,115,153,0.24)", "rgba(116,229,255,0.24)"][bombIndex % BOMB_POOL];
    const startMs = availableAt + randomInt(rng, 180, 480);
    const segmentCount = randomInt(rng, 2, 4);
    const holders: string[] = [];
    let current = pickWeighted(rng, aliveIds.filter((id) => id !== targetId), () => 1);
    holders.push(current);

    while (holders.length < segmentCount) {
        const nextChoices = aliveIds.filter((id) => id !== current && id !== targetId);
        if (nextChoices.length === 0) {
            break;
        }
        current = nextChoices[randomInt(rng, 0, nextChoices.length - 1)];
        holders.push(current);
    }

    holders.push(targetId);

    const segments: BombSegment[] = [];
    let cursor = startMs;
    for (let index = 0; index < holders.length - 1; index += 1) {
        const duration = randomInt(rng, 420, 680);
        segments.push({
            fromId: holders[index],
            toId: holders[index + 1],
            startMs: cursor,
            endMs: cursor + duration
        });
        cursor += duration;
    }

    const explosionMs = cursor + randomInt(rng, 720, 1180);

    return {
        id: `bomb-${bombSerial}`,
        accent: bombAccent,
        accentSoft: bombSoft,
        startMs,
        explosionMs,
        targetId,
        finalHolderId: holders[holders.length - 1],
        segments
    };
}

export function generateDynamiteScenario(winnerPlace: number, generation: number): DynamiteScenario {
    const winnerFaction = FACTIONS.find((faction) => faction.place === winnerPlace) ?? FACTIONS[0];
    const seed = (generation + 1) * 214013 + winnerFaction.place * 2531011;
    const rng = createRng(seed);
    const counts: Record<string, number> = Object.fromEntries(FACTIONS.map((faction) => [faction.id, INITIAL_SLOTS]));
    const bombs: BombPlan[] = [];
    const explosions: ExplosionEvent[] = [];
    const bombAvailability = Array.from({length: BOMB_POOL}, () => 0);
    let bombSerial = 0;

    while (Object.values(counts).filter((count) => count > 0).length > 1 && bombSerial < 160) {
        const alive = FACTIONS.filter((faction) => counts[faction.id] > 0);
        const nonWinnerAlive = alive.filter((faction) => faction.id !== winnerFaction.id);

        const target = pickWeighted(rng, alive, (faction) => {
            if (faction.id === winnerFaction.id) {
                if (counts[faction.id] <= 1 || nonWinnerAlive.length <= 1) return 0.01;
                return 0.24;
            }
            return 1 + (INITIAL_SLOTS - counts[faction.id]) * 0.12;
        });

        const bombIndex = bombAvailability.indexOf(Math.min(...bombAvailability));
        const aliveIds = alive.map((faction) => faction.id);
        const bomb = buildBombPlan(rng, bombIndex, bombAvailability[bombIndex], aliveIds, target.id, bombSerial);
        bombAvailability[bombIndex] = bomb.explosionMs + randomInt(rng, 260, 620);
        bombs.push(bomb);

        counts[target.id] -= 1;
        explosions.push({
            bombId: bomb.id,
            timeMs: bomb.explosionMs,
            targetId: target.id,
            remainingSlots: counts[target.id]
        });

        bombSerial += 1;
    }

    const durationMs = (explosions.at(-1)?.timeMs ?? 0) + 1800;

    return {
        winnerPlace: winnerFaction.place,
        winnerId: winnerFaction.id,
        factions: FACTIONS,
        initialSlots: INITIAL_SLOTS,
        initialCounts: Object.fromEntries(FACTIONS.map((faction) => [faction.id, INITIAL_SLOTS])),
        bombs,
        explosions,
        durationMs
    };
}

export function getDynamiteViewState(scenario: DynamiteScenario, elapsedMs: number): DynamiteViewState {
    const counts = cloneCounts(scenario.initialCounts);
    const activeBombs: ActiveBombState[] = [];
    const recentExplosions: RecentExplosionState[] = [];
    let completedExplosions = 0;
    let lastExplosion: ExplosionEvent | null = null;

    for (const explosion of scenario.explosions) {
        if (explosion.timeMs <= elapsedMs) {
            counts[explosion.targetId] = explosion.remainingSlots;
            completedExplosions += 1;
            lastExplosion = explosion;

            if (elapsedMs - explosion.timeMs <= EXPLOSION_FLASH_MS) {
                recentExplosions.push({
                    bombId: explosion.bombId,
                    targetId: explosion.targetId,
                    progress: (elapsedMs - explosion.timeMs) / EXPLOSION_FLASH_MS
                });
            }
        }
    }

    for (const bomb of scenario.bombs) {
        if (elapsedMs < bomb.startMs || elapsedMs > bomb.explosionMs) {
            continue;
        }

        const segment = bomb.segments.find((item) => elapsedMs >= item.startMs && elapsedMs <= item.endMs);
        if (segment) {
            activeBombs.push({
                id: bomb.id,
                mode: "flight",
                accent: bomb.accent,
                accentSoft: bomb.accentSoft,
                targetId: bomb.targetId,
                fromId: segment.fromId,
                toId: segment.toId,
                progress: (elapsedMs - segment.startMs) / Math.max(1, segment.endMs - segment.startMs),
                countdownMs: bomb.explosionMs - elapsedMs
            });
            continue;
        }

        const lastSegment = bomb.segments.at(-1);
        if (lastSegment && elapsedMs > lastSegment.endMs && elapsedMs < bomb.explosionMs) {
            activeBombs.push({
                id: bomb.id,
                mode: "armed",
                accent: bomb.accent,
                accentSoft: bomb.accentSoft,
                targetId: bomb.targetId,
                holderId: bomb.finalHolderId,
                progress: 1,
                countdownMs: bomb.explosionMs - elapsedMs
            });
        }
    }

    return {
        counts,
        activeBombs,
        recentExplosions,
        completedExplosions,
        lastExplosion
    };
}
