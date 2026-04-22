<script lang="ts">
    import {goto} from "$app/navigation";
    import AdminConfigurator from "$lib/components/AdminConfigurator.svelte";
    import {userStore} from "$lib/stores/userStore";

    $effect(() => {
        if ($userStore.role !== "ADMIN") {
            void goto("/lobby");
        }
    });
</script>

<AdminConfigurator/>
