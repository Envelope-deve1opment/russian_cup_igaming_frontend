<script lang="ts">
    import {ROOM_GAME_LABEL} from "$lib/constants";
    import {getRoomGameAccent} from "./room-games/palette";
    import RoomGameWidget from "./room-games/RoomGameWidget.svelte";
    import type {RoomGameSlot} from "./room-games/types";
    import type {RoomDetailsDto, RoomParticipantDto} from "$lib/api/dto";

    let {
        room,
        participants = [],
        winnerID,
        onComplete
    }: {
        room: RoomDetailsDto;
        participants?: RoomParticipantDto[];
        winnerID: string;
        onComplete?: () => void;
    } = $props();

    let widgetRef: { start: () => void } | null = $state(null);

    const orderedParticipants = $derived.by<RoomParticipantDto[]>(() => {
        const parts = participants.length > 0 ? participants : room.seats;
        console.log('RoomGameStage orderedParticipants', {
            participantsLength: participants.length,
            roomParticipantsLength: room.seats.length,
            partsLength: parts.length,
            parts: parts.map(p => ({id: p.id, name: p.username, seatNum: p.seatNum}))
        });
        return [...parts].sort((left, right) => (left.seatNum ?? Number.MAX_SAFE_INTEGER) - (right.seatNum ?? Number.MAX_SAFE_INTEGER));
    });

    const slots = $derived.by<RoomGameSlot[]>(() => {
            return orderedParticipants.map((participant, index) => {
                const accent = getRoomGameAccent(index);
                const place = participant.seatNum != null ? participant.seatNum + 1 : index + 1;

                return {
                    id: `${participant.id}-${participant.userId ?? index}`,
                    label: participant.username,
                    subtitle: `Место ${place}`,
                    place,
                    weight: Math.max(0.25, participant.weightSnapshot ?? 1),
                    accent: accent.accent,
                    accentSoft: accent.accentSoft
                };
            })
        }
    );

    const winnerSlotId = $derived.by(() => {
        const index = orderedParticipants.findIndex((entry) => entry.id === winnerID);
        if (index === -1) return null;
        const participant = orderedParticipants[index];
        return participant.id;
    });

    const winnerName = $derived.by(() => {
        return orderedParticipants.find((participant) => participant.id === winnerID || participant.id === winnerID)?.username ?? "Bot";
    });

    export function start(): void {
        if (slots.length === 0 || !winnerSlotId) {
            onComplete?.();
            return;
        }

        console.log(66767, widgetRef?.start);
        widgetRef?.start();
    }
</script>

<section aria-labelledby="room-game-title" class="roomGameStage">
    <div class="stageHero">
        <div>
            <p class="eyebrow">{ROOM_GAME_LABEL[room.gameType] || 'Неизвестная игра'}</p>
            <h1 id="room-game-title">Розыгрыш комнаты</h1>
            <p class="subtitle">Исход получен от сервера. Запускаем сцену на реальных участниках комнаты</p>
        </div>
        <div class="winnerBox">
            <span>Победитель</span>
            <strong>{winnerName}</strong>
        </div>
    </div>

    <div class="stagePanel">
        <RoomGameWidget bind:this={widgetRef} gameId={room.gameType} {onComplete} {slots} {winnerSlotId}/>
    </div>

    <div class="participants">
        {#each slots as slot (slot.id)}
            <div
                    class:activeWinner={slot.id === winnerSlotId}
                    class="participantCard"
                    style={`--slot-accent:${slot.accent}; --slot-soft:${slot.accentSoft};`}
            >
                <span>{slot.subtitle}</span>
                <strong>{slot.label}</strong>
                <small>Вес {slot.weight.toFixed(2)}</small>
            </div>
        {/each}
    </div>
</section>

<style lang="scss">
  .roomGameStage {
    max-width: 1080px;
    margin: 0 auto;
    display: grid;
    gap: 1rem;
  }

  .stageHero,
  .stagePanel,
  .participantCard {
    border-radius: 30px;
    border: 1px solid color-mix(in srgb, var(--color-border) 86%, transparent);
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 38%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface-elevated) 94%, transparent), color-mix(in srgb, var(--color-surface) 90%, transparent));
    box-shadow: 0 22px 46px rgba(0, 0, 0, 0.18);
  }

  .stageHero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.35rem;
    align-items: start;
  }

  .eyebrow {
    margin: 0 0 0.45rem;
    color: var(--color-accent);
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .stageHero h1 {
    margin: 0;
    font-size: clamp(1.7rem, 3vw, 2.5rem);
  }

  .subtitle {
    margin: 0.55rem 0 0;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .winnerBox {
    min-width: 190px;
    padding: 0.9rem 1rem;
    border-radius: 24px;
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    text-align: right;
  }

  .winnerBox span {
    display: block;
    color: var(--color-text-muted);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .winnerBox strong {
    display: block;
    margin-top: 0.4rem;
    font-size: 1.28rem;
  }

  .stagePanel {
    padding: 1rem;
  }

  .participants {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.75rem;
  }

  .participantCard {
    padding: 0.9rem 1rem;
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--slot-accent) 14%, transparent), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--slot-soft) 44%, rgba(16, 18, 25, 0.84)), rgba(16, 18, 25, 0.9));
  }

  .participantCard.activeWinner {
    border-color: color-mix(in srgb, var(--slot-accent) 60%, white 10%);
    box-shadow: 0 18px 30px color-mix(in srgb, var(--slot-accent) 16%, transparent);
  }

  .participantCard span,
  .participantCard small {
    display: block;
    color: rgba(255, 255, 255, 0.68);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .participantCard strong {
    display: block;
    margin: 0.4rem 0 0.5rem;
    font-size: 1rem;
    color: #fff;
  }

  @media (max-width: 720px) {
    .stageHero {
      flex-direction: column;
    }

    .winnerBox {
      width: 100%;
      text-align: left;
    }
  }
</style>
