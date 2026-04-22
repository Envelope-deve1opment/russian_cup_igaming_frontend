import {AUTH_SESSION_TOKEN_KEY} from "$lib/constants/authStorage";

const DEFAULT_API_URL = "http://localhost:8080/api" as const;
const apiBaseURL: string = (import.meta.env.PUBLIC_API_URL as string | undefined)?.trim() || DEFAULT_API_URL;

export class APIError extends Error {
    public readonly status: number;
    public readonly details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.details = details;
    }
}

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    withAuth?: boolean;
    timeoutMs?: number;
};

function readToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }
    return sessionStorage.getItem(AUTH_SESSION_TOKEN_KEY);
}

function toURL(path: string): string {
    if (/^https?:\/\//.test(path)) {
        return path;
    }
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBaseURL}${normalizedPath}`;
}

export async function requestJSON<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {body, withAuth = true, timeoutMs = 12_000, headers, ...init} = options;
    const controller = new AbortController();
    const timeoutID = setTimeout(() => controller.abort(), timeoutMs);
    const requestHeaders = new Headers(headers);
    requestHeaders.set("Accept", "application/json");

    if (body !== undefined) {
        requestHeaders.set("Content-Type", "application/json");
    }
    if (withAuth) {
        const token = readToken();
        if (token) {
            requestHeaders.set("Authorization", `Bearer ${token}`);
        }
    }

    try {
        const res = await fetch(toURL(path), {
            ...init,
            headers: requestHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal
        });

        const raw = await res.text();
        const data: unknown = raw ? JSON.parse(raw) : undefined;

        if (!res.ok) {
            const message = typeof data === "object" && data !== null && "message" in data
                ? String((data as { message: unknown }).message)
                : `API request failed (${res.status})`;
            throw new APIError(message, res.status, data);
        }

        return data as T;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new APIError("Request timeout", 408);
        }
        throw new APIError("Network error", 0, error);
    } finally {
        clearTimeout(timeoutID);
    }
}
