import {writable} from "svelte/store";

export type AuthState = {
    status: "anonymous" | "loading" | "authenticated";
    /** Сообщение последней ошибки входа (очищается при новой попытке). */
    errorMessage?: string;
};

export const authStore = writable<AuthState>({status: "anonymous"});
