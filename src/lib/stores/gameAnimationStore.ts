import {writable} from "svelte/store";

export const gameAnimationStore = writable<boolean>(false);

export function setAnimationPlaying(playing: boolean): void {
    gameAnimationStore.set(playing);
}
