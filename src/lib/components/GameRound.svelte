<script lang="ts">
    import {goto} from "$app/navigation";
    import type {Participant, Room} from "$lib/types";
    import {roomsStore} from "$lib/stores/roomsStore";

    let {
        roomId,
        winnerID,
        participants,
        prizeAmount
    }: {
        roomId: string;
        winnerID: string;
        participants: Participant[];
        prizeAmount: number;
    } = $props();

    let winnerName: string = $derived(participants.find((p) => p.id === winnerID)?.name ?? winnerID);

    function pickSimilarRoom(): string | null {
        const list: Room[] = $roomsStore.filter((r) => r.id !== roomId);

        if (list.length === 0) return null;

        const self: Room | undefined = $roomsStore.find((r) => r.id === roomId);
        const target: number = self?.entryPrice ?? 0;
        let best: Room = list[0];
        let bestDiff: number = Math.abs(best.entryPrice - target);

        for (const r of list) {
            const d = Math.abs(r.entryPrice - target);

            if (d < bestDiff) {
                best = r;
                bestDiff = d;
            }
        }
        return best?.id ?? null;
    }

    function pickRiskRoom(): string | null {
        const self: Room | undefined = $roomsStore.find((r) => r.id === roomId);
        const minPrice: number = (self?.entryPrice ?? 0) * 1.15;
        const riskier: Room[] = $roomsStore.filter((r) => r.id !== roomId && r.entryPrice >= minPrice);

        if (riskier.length === 0) return null;

        return riskier.reduce((a, b) => (a.entryPrice >= b.entryPrice ? a : b)).id;
    }

    function goSimilar(): void {
        const ID: string | null = pickSimilarRoom();

        if (ID) {
            goto(`/room/${ID}`)
        } else {
            goto("/lobby")
        }
    }

    function goRisk(): void {
        const ID: string | null = pickRiskRoom();

        if (ID) {
            goto(`/room/${ID}`)
        } else {
            goto("/lobby")
        }
    }
</script>


<section aria-labelledby="round-title" class="round">
    <h1 class="title" id="round-title">Раунд завершён</h1>
    <p class="winner">Победитель: <span class="accent">{winnerName}</span></p>
    <p class="prize">Приз: {prizeAmount.toLocaleString("ru-RU")} бонусов</p>

    <div class="cta">
        <button class="btn primary" onclick={() => goto("/lobby")} type="button">Играть снова</button>
        <button class="btn" onclick={goSimilar} type="button">Похожая комната</button>
        <button class="btn danger" onclick={goRisk} type="button">Рискнуть</button>
    </div>

    <p class="hint">Анимация раунда будет добавлена позже — экран готов к подключению сцены</p>
</section>


<style lang="scss">
  @import "./GameRound.scss";
</style>
