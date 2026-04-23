<script lang="ts">
    import {browser} from "$app/environment";
    import {page} from "$app/stores";
    import {onDestroy, onMount} from "svelte";
    import favicon from "$lib/assets/favicon.svg";
    import ThemeSwitcher from "$lib/components/ThemeSwitcher.svelte";
    import {clearAuth, restoreSession} from "$lib/api/authApi";
    import {startRoomsRealtime, stopRoomsRealtime} from "$lib/api/roomsRealtime";
    import {startBalanceRefresh, stopBalanceRefresh} from "$lib/api/balanceService";
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
        startBalanceRefresh(10);
    });

    onDestroy(() => {
        stopRoomsRealtime();
        stopBalanceRefresh();
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
                        <div class="balanceGroup">
                            <span class="balanceItem">
                                <svg class="balanceIcon" fill="none" height="14" stroke="currentColor" stroke-width="2"
                                     viewBox="0 0 24 24" width="14">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="m8 12 3 3 5-6"/>
                                </svg>
                                <span class="userBalance">{$userStore.bonusBalance.toLocaleString("ru-RU")}</span>
                            </span>
                            {#if $userStore.reservedAmount > 0}
                                <span class="balanceDivider"></span>
                                <span class="balanceItem muted" title="Зарезервировано">
                                    <svg class="balanceIcon" fill="none" height="14" stroke="currentColor"
                                         stroke-width="2" viewBox="0 0 24 24" width="14">
                                        <rect height="14" rx="2" width="20" x="2" y="5"/>
                                        <path d="M2 10h20"/>
                                    </svg>
                                    <span class="userBalance">{$userStore.reservedAmount.toLocaleString("ru-RU")}</span>
                                </span>
                            {/if}
                        </div>
                        <button class="logout" onclick={() => clearAuth()} type="button" title="Выйти">
                            <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                                 width="16">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" x2="9" y1="12" y2="12"/>
                            </svg>
                        </button>
                    {:else}
                        <a class="loginLink" data-sveltekit-preload-data="hover" href="/login">
                            <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                                 width="16">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10,17 15,12 10,7"/>
                                <line x1="15" x2="3" y1="12" y2="12"/>
                            </svg>
                            Войти
                        </a>
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
