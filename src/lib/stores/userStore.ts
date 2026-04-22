import {writable} from "svelte/store";
import type {User} from "$lib/types";

// Профиль до входа или после выхода
export const GUEST_USER: User = {
    id: "guest",
    name: "Гость",
    role: "USER",
    bonusBalance: 0
};

export const userStore = writable<User>(GUEST_USER);

export function debit(amount: number): boolean {
    if (amount <= 0) return true;
    let ok: boolean = false;

    userStore.update((u: User): User => {
        if (u.bonusBalance < amount) {
            ok = false;
            return u;
        }

        ok = true;

        return {...u, bonusBalance: u.bonusBalance - amount};
    });

    return ok;
}

// Списание стоимости буста; возвращает false при недостатке баланса
export function purchaseBoost(cost: number | undefined): boolean {
    if (cost == null || cost <= 0) return false;

    return debit(cost);
}
