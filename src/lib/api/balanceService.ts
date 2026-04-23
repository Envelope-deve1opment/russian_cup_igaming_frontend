import {requestJSON} from "$lib/api/baseAPI";
import {userStore} from "$lib/stores/userStore";
import {get} from "svelte/store";
import {gameAnimationStore} from "$lib/stores/gameAnimationStore";

interface BalanceInfo {
    balance: number;
    reservedAmount: number;
}

export async function refreshBalance(): Promise<void> {
    const isAnimationPlaying = get(gameAnimationStore);
    if (isAnimationPlaying) {
        return;
    }

    try {
        const balanceInfo = await requestJSON<BalanceInfo>("/wallets/me", {
            method: "GET"
        });

        userStore.update((user) => ({
            ...user,
            bonusBalance: balanceInfo.balance,
            reservedAmount: balanceInfo.reservedAmount
        }));
    } catch {
        // Игнорируем ошибки обновления баланса (например, если не авторизован)
    }
}

let balanceIntervalId: ReturnType<typeof setInterval> | null = null;

export function startBalanceRefresh(intervalSeconds: number = 10): void {
    stopBalanceRefresh();
    balanceIntervalId = setInterval(() => {
        void refreshBalance();
    }, intervalSeconds * 1000);
}

export function stopBalanceRefresh(): void {
    if (balanceIntervalId) {
        clearInterval(balanceIntervalId);
        balanceIntervalId = null;
    }
}
