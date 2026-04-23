<script lang="ts">
    import {goto} from "$app/navigation";
    import {loginAndStore} from "$lib/api/authApi";
    import {authStore} from "$lib/stores/authStore";

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
            // сообщение об ошибке уже приходит из authStore
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:head>
    <title>Вход — Quick Rooms</title>
</svelte:head>

<section class="page">
    <div class="intro">
        <p class="eyebrow">Access</p>
        <h1 class="title">Подключение к игровому контуру.</h1>
        <p class="lead">Введите bearer-токен и откройте полный интерфейс комнаты, лобби и визуальных режимов.</p>
    </div>

    <form class="form" onsubmit={onsubmit}>
        <label class="label">
            <span>Access token</span>
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
                {submitting || $authStore.status === "loading" ? "Подключаем..." : "Войти"}
            </button>
            <a class="back" href="/lobby">Продолжить как гость</a>
        </div>
    </form>
</section>

<style lang="scss">
  @import "./Login.scss";
</style>
