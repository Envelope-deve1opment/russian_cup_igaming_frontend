export type RaceRunner = {
    id: string;
    number: number;
    name: string;
    accent: string;
    accentSoft: string;
};

export type RaceEventKind = "boost" | "drift" | "slip";

export type RaceEvent = {
    kind: RaceEventKind;
    label: string;
    startStep: number;
    endStep: number;
};

export type RaceLane = {
    runner: RaceRunner;
    checkpoints: number[];
    finishTimeMs: number;
    events: RaceEvent[];
};

export type RaceScenario = {
    seed: number;
    steps: number;
    durationMs: number;
    winnerId: string;
    lanes: RaceLane[];
};

const RUNNERS: RaceRunner[] = [
    {id: "atlas", number: 1, name: "Atlas V8", accent: "#ff7b54", accentSoft: "rgba(255, 123, 84, 0.22)"},
    {id: "nova", number: 2, name: "Nova Rush", accent: "#6bd8ff", accentSoft: "rgba(107, 216, 255, 0.22)"},
    {id: "flare", number: 3, name: "Flare GT", accent: "#ffd166", accentSoft: "rgba(255, 209, 102, 0.2)"},
    {id: "pulse", number: 4, name: "Pulse XR", accent: "#c77dff", accentSoft: "rgba(199, 125, 255, 0.22)"},
    {id: "comet", number: 5, name: "Comet S", accent: "#80ed99", accentSoft: "rgba(128, 237, 153, 0.22)"},
    {id: "onyx", number: 6, name: "Onyx Turbo", accent: "#ff5d8f", accentSoft: "rgba(255, 93, 143, 0.22)"},
    {id: "loshara", number: 7, name: "Loh ebanniy", accent: "#141414", accentSoft: "rgba(76, 76, 76, 0.22)"}
];

type SeededRng = () => number;

function createSeededRandom(seed: number): SeededRng {
    let state = seed >>> 0;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function randomBetween(rng: SeededRng, min: number, max: number): number {
    return min + rng() * (max - min);
}

function randomInt(rng: SeededRng, min: number, max: number): number {
    return Math.floor(randomBetween(rng, min, max + 1));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function buildEvents(rng: SeededRng, steps: number, winner: boolean): RaceEvent[] {
    const earlyStart = randomInt(rng, 2, 7);
    const driftStart = randomInt(rng, 9, 15);
    const lateStart = winner ? randomInt(rng, 18, 23) : randomInt(rng, 20, 25);

    return [
        {kind: "boost", label: "нитро", startStep: earlyStart, endStep: earlyStart + randomInt(rng, 2, 4)},
        {kind: "drift", label: "занос", startStep: driftStart, endStep: driftStart + randomInt(rng, 2, 4)},
        {kind: winner ? "boost" : "slip", label: winner ? "рывок" : "потеря темпа", startStep: lateStart, endStep: lateStart + randomInt(rng, 2, 4)}
    ];
}

function eventImpact(events: RaceEvent[], step: number, winner: boolean): number {
    return events.reduce((total, event) => {
        if (step < event.startStep || step > event.endStep) {
            return total;
        }

        if (event.kind === "boost") {
            return total + (winner && event.label === "рывок" ? 0.62 : 0.34);
        }
        if (event.kind === "drift") {
            return total - 0.2;
        }
        return total - 0.32;
    }, 0);
}

function createCheckpoints(rng: SeededRng, steps: number, winner: boolean, events: RaceEvent[]): number[] {
    const raw: number[] = [0];
    let total = 0;

    for (let step = 1; step <= steps; step += 1) {
        const base = winner ? 0.92 : 0.95;
        const volatility = randomBetween(rng, -0.25, 0.28);
        const pacing = eventImpact(events, step, winner);
        const lateBias = winner ? Math.max(0, (step - steps * 0.55) / steps) * 0.38 : 0;
        const delta = clamp(base + volatility + pacing + lateBias, 0.18, winner ? 1.95 : 1.7);
        total += delta;
        raw.push(total);
    }

    return raw.map((value) => value / total);
}

function createLane(runner: RaceRunner, rng: SeededRng, steps: number, winnerId: string, position: number): RaceLane {
    const winner = runner.id === winnerId;
    const events = buildEvents(rng, steps, winner);
    const checkpoints = createCheckpoints(() => rng(), steps, winner, events);
    const baseWinnerTime = 7200 + position * 60;
    const finishTimeMs = winner
        ? Math.round(baseWinnerTime + randomBetween(rng, 0, 320))
        : Math.round(baseWinnerTime + 520 + position * 210 + randomBetween(rng, 0, 760));

    return {
        runner,
        checkpoints,
        finishTimeMs,
        events
    };
}

export function getRaceRunners(): RaceRunner[] {
    return RUNNERS;
}

export function generateRaceScenario(winnerId: string, generation: number): RaceScenario {
    const winnerIndex = RUNNERS.findIndex((runner) => runner.id === winnerId);
    const seed = (generation + 1) * 2654435761 + Math.max(0, winnerIndex) * 7919;
    const rng = createSeededRandom(seed);
    const steps = 30;
    const shuffled = [...RUNNERS].sort(() => rng() - 0.5);
    const lanes = shuffled.map((runner, index) => createLane(runner, rng, steps, winnerId, index));
    const winnerLane = lanes.find((lane) => lane.runner.id === winnerId);

    if (winnerLane) {
        const minOtherTime = Math.min(...lanes.filter((lane) => lane.runner.id !== winnerId).map((lane) => lane.finishTimeMs));
        winnerLane.finishTimeMs = Math.min(winnerLane.finishTimeMs, minOtherTime - 420);
    }

    const durationMs = Math.max(...lanes.map((lane) => lane.finishTimeMs)) + 800;

    return {
        seed,
        steps,
        durationMs,
        winnerId,
        lanes
    };
}

export function getLaneProgress(lane: RaceLane, elapsedMs: number): number {
    if (elapsedMs <= 0) {
        return 0;
    }
    if (elapsedMs >= lane.finishTimeMs) {
        return 1;
    }

    const ratio = elapsedMs / lane.finishTimeMs;
    const lastIndex = lane.checkpoints.length - 1;
    const exact = ratio * lastIndex;
    const lowerIndex = Math.floor(exact);
    const upperIndex = Math.min(lastIndex, lowerIndex + 1);
    const local = exact - lowerIndex;
    const lower = lane.checkpoints[lowerIndex];
    const upper = lane.checkpoints[upperIndex];

    return lower + (upper - lower) * local;
}

export function getActiveEvent(lane: RaceLane, elapsedMs: number): RaceEvent | null {
    if (elapsedMs <= 0 || elapsedMs >= lane.finishTimeMs) {
        return null;
    }

    const exact = (elapsedMs / lane.finishTimeMs) * (lane.checkpoints.length - 1);
    return lane.events.find((event) => exact >= event.startStep && exact <= event.endStep) ?? null;
}
