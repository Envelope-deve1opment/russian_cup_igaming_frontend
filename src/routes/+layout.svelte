<script lang="ts">
    import {browser} from "$app/environment";
    import {page} from "$app/stores";
    import {onDestroy, onMount} from "svelte";
    import favicon from "$lib/assets/favicon.svg";
    import ThemeSwitcher from "$lib/components/ThemeSwitcher.svelte";
    import {clearAuth, restoreSession} from "$lib/services/authApi";
    import {startRoomsRealtime, stopRoomsRealtime} from "$lib/services/roomsRealtime";
    import {authStore} from "$lib/stores/authStore";
    import {THEME_STORAGE_KEY, themeStore} from "$lib/stores/themeStore";
    import {userStore} from "$lib/stores/userStore";

    let {children} = $props();

    function navActive(href: string, pathname: string): boolean {
        if (href === "/lobby") {
            return pathname === "/lobby" || pathname === "/";
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    }

    $effect(() => {
        if (!browser) {
            return;
        }

        const id = $themeStore;
        document.documentElement.dataset.theme = id;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, id);
        } catch {
        }
    });

    onMount(async () => {
        void restoreSession();
        void startRoomsRealtime();
    });

    onDestroy(() => {
        stopRoomsRealtime();
    });
</script>

<svelte:head>
    <link href={favicon} rel="icon"/>
    <link href="https://fonts.googleapis.com" rel="preconnect"/>
    <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
    <link
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@400;500;700;800&display=swap"
            rel="stylesheet"
    />
    <title>Quick Rooms</title>
</svelte:head>

<div class="shell">
    <div aria-hidden="true" class="ambient ambientA"></div>
    <div aria-hidden="true" class="ambient ambientB"></div>
    <div aria-hidden="true" class="gridGlow"></div>

    <header class="topbar">
        <div class="topbarInner">
            <div class="topbarMain">
                <a class="brand" href="/lobby">
                    <span aria-hidden="true" class="brandMark">
                        <svg fill="currentColor" height="22" viewBox="0 0 24 24" width="22"
                             xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3.2 20.5 12 12 20.8 3.5 12 12 3.2z" opacity="0.95"/>
                        </svg>
                    </span>
                    <span class="brandText">
                        <span class="brandTitle">Quick Rooms</span>
                        <span class="brandTag">Live</span>
                    </span>
                </a>
                <nav aria-label="Основная навигация" class="nav">
                    <a
                            aria-current={navActive("/lobby", $page.url.pathname) ? "page" : undefined}
                            class:active={navActive("/lobby", $page.url.pathname)}
                            data-sveltekit-preload-data="hover"
                            href="/lobby"
                    >Лобби</a>
                    <a
                            aria-current={navActive("/history", $page.url.pathname) ? "page" : undefined}
                            class:active={navActive("/history", $page.url.pathname)}
                            data-sveltekit-preload-data="hover"
                            href="/history"
                    >Журнал</a>
                    <a
                            aria-current={navActive("/wheel", $page.url.pathname) ? "page" : undefined}
                            class:active={navActive("/wheel", $page.url.pathname)}
                            data-sveltekit-preload-data="hover"
                            href="/wheel"
                    >Колесо</a>
                    <a
                            aria-current={navActive("/races", $page.url.pathname) ? "page" : undefined}
                            class:active={navActive("/races", $page.url.pathname)}
                            data-sveltekit-preload-data="hover"
                            href="/races"
                    >Гонки</a>
                    <a
                            aria-current={navActive("/roulette", $page.url.pathname) ? "page" : undefined}
                            class:active={navActive("/roulette", $page.url.pathname)}
                            data-sveltekit-preload-data="hover"
                            href="/roulette"
                    >Рулетка</a>
                    <a
                            aria-current={navActive("/battle", $page.url.pathname) ? "page" : undefined}
                            class:active={navActive("/battle", $page.url.pathname)}
                            data-sveltekit-preload-data="hover"
                            href="/battle"
                    >Битва</a>
                    <a
                            aria-current={navActive("/dynamite", $page.url.pathname) ? "page" : undefined}
                            class:active={navActive("/dynamite", $page.url.pathname)}
                            data-sveltekit-preload-data="hover"
                            href="/dynamite"
                    >Динамит</a>
                    {#if $userStore.role === "ADMIN"}
                        <a
                                aria-current={navActive("/admin", $page.url.pathname) ? "page" : undefined}
                                class:active={navActive("/admin", $page.url.pathname)}
                                data-sveltekit-preload-data="hover"
                                href="/admin"
                        >Админ</a>
                    {/if}
                </nav>
            </div>
            <div class="topbarRight">
                <ThemeSwitcher/>
                <div class="userBar">
                    {#if $authStore.status === "loading"}
                        <span class="userMeta">...</span>
                    {:else if $authStore.status === "authenticated"}
                        <span class="userMeta" title={$userStore.name}>{$userStore.name}</span>
                        <span class="balancePill">
                            <span class="balanceLabel">банк</span>
                            <span class="userBalance">{$userStore.bonusBalance.toLocaleString("ru-RU")}</span>
                        </span>
                        <button class="logout" onclick={() => clearAuth()} type="button">Выйти</button>
                    {:else}
                        <span class="userMeta">{$userStore.name}</span>
                        <a class="loginLink" data-sveltekit-preload-data="hover" href="/login">Войти</a>
                    {/if}
                </div>
            </div>
        </div>
    </header>
    <main class="main">
        <div class="mainInner">
            {@render children()}
        </div>
    </main>
</div>

<style lang="scss">
  @import "./+layout.scss";
</style>
