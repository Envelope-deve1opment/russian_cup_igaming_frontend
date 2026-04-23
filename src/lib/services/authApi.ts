import {browser} from "$app/environment";
import {APIError, requestJSON} from "$lib/api/baseAPI";
import {technicalUserService} from "$lib/api/technicalUserService";
import type {CurrentUserResponse, MockLoginResponse, TechnicalUserDto} from "$lib/api/dto";
import {AUTH_SESSION_TOKEN_KEY} from "$lib/constants/authStorage";
import {authStore} from "$lib/stores/authStore";
import {GUEST_USER, userStore} from "$lib/stores/userStore";
import type {AuthLoginResponse, User} from "$lib/types";

function mapCurrentUser(data: CurrentUserResponse): User {
    return {
        id: data.userId,
        name: data.username,
        role: "USER",
        bonusBalance: 0,
        reservedAmount: 0
    };
}

async function enrichRole(user: User): Promise<User> {
    try {
        const allUsers: TechnicalUserDto[] = await technicalUserService.getAll();
        const found = allUsers.find((item) => item.id === user.id || item.username === user.name);
        if (!found) {
            return user;
        }
        return {...user, role: found.role};
    } catch {
        return user;
    }
}

function toReadableAuthError(error: unknown): Error {
    if (error instanceof APIError) {
        if (error.status === 401 || error.status === 403) {
            return new Error("Неверный или просроченный токен");
        }
        if (error.status === 0) {
            return new Error("Не удалось подключиться к API");
        }
        return new Error(`Ошибка сервера: ${error.status}`);
    }
    return error instanceof Error ? error : new Error("Не удалось войти");
}

async function loadMe(token: string): Promise<CurrentUserResponse> {
    return await requestJSON<CurrentUserResponse>("/users/me", {
        headers: {Authorization: `Bearer ${token}`},
        withAuth: false
    });
}

export async function loginWithBearerToken(rawToken: string): Promise<AuthLoginResponse> {
    const username = rawToken.trim();
    if (!username) {
        throw new Error("Введите токен доступа");
    }

    try {
        const login = await requestJSON<MockLoginResponse>("/auth/mock-login", {
            method: "POST",
            body: {username},
            withAuth: false
        });
        const me = await loadMe(login.token);

        const balanceInfo = await requestJSON<
            {balance: number, reservedAmount: number}
        >("/wallets/me", {
            "method": "GET",
            withAuth: true,
            token: login.token
        })

        const user: User = {
            ...await enrichRole(mapCurrentUser(me)),
            bonusBalance: balanceInfo.balance,
            reservedAmount: balanceInfo.reservedAmount
        };
        return {
            accessToken: login.token,
            tokenType: "Bearer",
            expiresIn: 3600,
            user
        };
    } catch (error) {
        throw toReadableAuthError(error);
    }
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

export async function loginAndStore(rawToken: string): Promise<AuthLoginResponse> {
    authStore.set({status: "loading", errorMessage: undefined});

    try {
        const data: AuthLoginResponse = await loginWithBearerToken(rawToken);
        applyAuthResponse(data);

        return data;
    } catch (e) {
        const message: string = e instanceof Error ? e.message : "Не удалось войти";
        authStore.set({status: "anonymous", errorMessage: message});
        userStore.set(GUEST_USER);
        throw e;
    }
}

export async function restoreSession(): Promise<void> {
    if (!browser) {
        return;
    }

    const stored: string | null = sessionStorage.getItem(AUTH_SESSION_TOKEN_KEY);

    if (!stored) {
        return;
    }

    authStore.set({status: "loading"});

    try {
        const data: AuthLoginResponse = await loginWithBearerToken(stored);
        applyAuthResponse(data);
    } catch {
        sessionStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
        userStore.set(GUEST_USER);
        authStore.set({status: "anonymous", errorMessage: undefined});
    }
}
