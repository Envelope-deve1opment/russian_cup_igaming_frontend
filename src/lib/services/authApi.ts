import {browser} from "$app/environment";
import {AUTH_SESSION_TOKEN_KEY} from "$lib/constants/authStorage";
import {authStore} from "$lib/stores/authStore";
import {GUEST_USER, userStore} from "$lib/stores/userStore";
import type {AuthLoginResponse, User} from "$lib/types";

/**
 * Мок «передачи токена на бэкенд».
 * Замена на реальный API: раскомментировать fetch и убрать имитацию задержки.
 */
export async function loginWithBearerToken(rawToken: string): Promise<AuthLoginResponse> {
    const token = rawToken.trim();

    if (!token) {
        throw new Error("Введите токен доступа");
    }

    // Имитация сети
    await new Promise((r) => setTimeout(r, 400));

    /*
    const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/auth/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        }
    });
    if (!res.ok) {
        throw new Error(res.status === 401 ? "Неверный или просроченный токен" : `Ошибка сервера: ${res.status}`);
    }
    return (await res.json()) as AuthLoginResponse;
    */

    const fail = ["invalid", "401", "403", "error"];

    if (fail.includes(token.toLowerCase())) {
        throw new Error("Сервер отклонил токен");
    }

    const user: User = {
        id: `user-${hashToken(token)}`,
        name: formatDisplayName(token),
        bonusBalance: 25_000
    };

    return {
        accessToken: token,
        tokenType: "Bearer",
        expiresIn: 3600,
        user
    };
}

function hashToken(s: string): string {
    let h = 0;

    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }

    return Math.abs(h).toString(36).slice(0, 12);
}

function formatDisplayName(token: string): string {
    if (token.length <= 24) {
        return `VIP · ${token}`;
    }

    return `VIP · ${token.slice(0, 10)}…`;
}

export function applyAuthResponse(data: AuthLoginResponse): void {
    if (browser) {
        sessionStorage.setItem(AUTH_SESSION_TOKEN_KEY, data.accessToken);
    }

    userStore.set(data.user);
    authStore.set({status: "authenticated", errorMessage: undefined});
}

export function clearAuth(): void {
    if (browser) {
        sessionStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
    }

    userStore.set(GUEST_USER);
    authStore.set({status: "anonymous", errorMessage: undefined});
}

/** Вход: запрос к мок-API и сохранение сессии. */
export async function loginAndStore(rawToken: string): Promise<AuthLoginResponse> {
    authStore.set({status: "loading", errorMessage: undefined});

    try {
        const data = await loginWithBearerToken(rawToken);
        applyAuthResponse(data);

        return data;
    } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось войти";
        authStore.set({status: "anonymous", errorMessage: message});
        userStore.set(GUEST_USER);
        throw e;
    }
}

/** Восстановление сессии из sessionStorage (вызывать в корневом layout на клиенте). */
export async function restoreSession(): Promise<void> {
    if (!browser) {
        return;
    }

    const stored = sessionStorage.getItem(AUTH_SESSION_TOKEN_KEY);

    if (!stored) {
        return;
    }

    authStore.set({status: "loading"});

    try {
        const data = await loginWithBearerToken(stored);
        applyAuthResponse(data);
    } catch {
        sessionStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
        userStore.set(GUEST_USER);
        authStore.set({status: "anonymous", errorMessage: undefined});
    }
}
