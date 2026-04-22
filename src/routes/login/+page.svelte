<script lang="ts">
    import {goto} from "$app/navigation";
    import {authStore} from "$lib/stores/authStore";
    import {loginAndStore} from "$lib/services/authApi";

    let token = $state("");
    let submitting = $state(false);

    $effect(() => {
        if ($authStore.status === "authenticated") {
            void goto("/lobby");
        }
    });

    async function onsubmit(e: Event): Promise<void> {
        e.preventDefault();

        if (submitting) {
            return;
        }

        submitting = true;

        try {
            await loginAndStore(token);
            await goto("/lobby");
        } catch {
            /* сообщение уже в authStore */
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:head>
    <title>Вход — VIP Quick Rooms</title>
</svelte:head>

<div class="page">
    <h1 class="title">Вход по токену</h1>
    <p class="lead">
        Токен отправляется в API, после чего загружается профиль текущего пользователя.
    </p>

    <form class="form" onsubmit={onsubmit}>
        <label class="label">
            <span>Access token (Bearer)</span>
            <input
                    autocomplete="off"
                    bind:value={token}
                    class="tokenInput"
                    placeholder="например demo-token-7xK9"
                    required
                    type="text"
            />
        </label>

        {#if $authStore.errorMessage}
            <p class="error" role="alert">{$authStore.errorMessage}</p>
        {/if}

        <div class="actions">
            <button class="submit" disabled={submitting || $authStore.status === "loading"} type="submit">
                {submitting || $authStore.status === "loading" ? "Запрос…" : "Войти"}
            </button>
            <a class="back" href="/lobby">В лобби без входа</a>
        </div>
    </form>
</div>

<style lang="scss">
  @import "./Login.scss";
</style>
