<script lang="ts">
    import {goto} from "$app/navigation";
    import {onMount} from "svelte";

    onMount(() => {
        void goto("/lobby", {replaceState: true});
    });
</script>

<p style="margin: 2rem auto; max-width: 22rem; text-align: center; color: var(--color-text-muted);">
    Переходим в лобби…
</p>
