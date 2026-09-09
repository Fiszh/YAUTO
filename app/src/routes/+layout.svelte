<script lang="ts">
    import { onMount } from "svelte";

    import Sidebar from "$components/Main/Sidebar.svelte";

    import "$styles/variables.scss";
    import "$styles/reset.css";
    import "$styles/app.scss";

    import { page } from "$app/state";
    import Banner from "$components/Banner.svelte";
    import { isMobile } from "$stores/global";

    import { RenderScan } from "svelte-render-scan";
    import ToastWrapper from "$components/toast/Wrapper.svelte";
    import { dev } from "$app/env";

    let { data, children } = $props();

    let mounted = $state<boolean>(false);
    let hasChannel = $state<boolean>(false);

    const setMobile = () => isMobile.set(window.innerWidth <= 768);

    let accentColor = $state("var(--default-accent)");

    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        hasChannel =
            params.has("channel") ||
            params.has("id") ||
            params.has("kick") ||
            params.has("youtube");

        setMobile();
        window.addEventListener("resize", setMobile);

        mounted = true;

        if (dev) accentColor = "#ffb020";
    });

    interface AllowedSite {
        RegEx: RegExp;
        type: "full" | "limited";
    }

    const allowedSites: AllowedSite[] = [
        {
            RegEx: /^https:\/\/[a-zA-Z0-9-]+\.unii\.dev\//,
            type: "full",
        },
        {
            RegEx: /^https:\/\/[a-zA-Z0-9-]+\.pogly\.gg\//,
            type: "full",
        },
        {
            RegEx: /^https:\/\/([a-zA-Z0-9-]+\.)?duduck\.net\//,
            type: "limited",
        },
    ];

    const isSiteAllowed = (url: string | null) => {
        if (!url) return "restricted";

        const allowedSite = allowedSites.find((s) => s["RegEx"].test(url));

        return allowedSite ? allowedSite["type"] : "restricted";
    };
</script>

<svelte:head>
    <link
        rel="icon"
        href={dev ? "/images/logo_dev.svg" : "/images/logo.svg"}
        type="image/svg+xml"
    />
</svelte:head>

{#if __DEBUG__}
    <RenderScan />
{/if}

{#if data.isEmbedded && isSiteAllowed(data.embedderUrl) == "limited"}
    <div id="embed-of">
        <p>EMBED OF:</p>
        <a href={window.location.origin}>{window.location.host}</a>
    </div>
{/if}

{#if mounted}
    <div style="display:contents; --accent: {accentColor}">
        {#if data.isEmbedded && isSiteAllowed(data.embedderUrl) == "restricted"}
            <div id="not-allowed">
                <h1>EMBED NOT SUPORTED</h1>
                <p>offending site: {data.embedderUrl}</p>
                <p>CHECK OUT UCHAT</p>
                <a href={window.location.origin}>{window.location.host}</a>
            </div>
        {:else}
            {#if !hasChannel}
                <ToastWrapper />
                {#if data.statusMessage == null}
                    <Banner type="fail" />
                {:else if data.statusMessage && (data.statusMessage.type || data.statusMessage.message)}
                    <Banner {...data.statusMessage} />
                {/if}
                <main>
                    {#if page.status == 200 && !["/auth"].includes(page.route.id ?? "")}
                        <Sidebar />
                    {/if}
                    {@render children()}
                </main>
            {:else}
                {@render children()}
            {/if}
        {/if}
    </div>
{:else}
    <main>Loading...</main>
{/if}

<noscript style="color:black;">
    <div>
        <h1>JavaScript is disabled</h1>
        <p>This app requires JavaScript to work.</p>
        <p>Enable JavaScript to use the app.</p>
    </div>
</noscript>

<style>
    main {
        display: flex;
        width: 100%;
        height: 100%;

        overflow: hidden;

        background: #0a0a0a;
    }

    #embed-of,
    #not-allowed {
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    #not-allowed {
        background-color: rgba(255, 0, 0, 0.25);
        height: 100%;
        width: 100%;
        width: 100dvw;
        height: 100dvh;
    }

    #embed-of {
        background-color: #0e0e0e;
        padding: 0.5rem 1rem;
        position: absolute;
        font-weight: bold;
        border-radius: 0.75rem;
        right: 0.5rem;
        bottom: 0.5rem;
        border: 1px var(--accent) solid;
    }

    @media (max-width: 768px) {
        main {
            flex-direction: column-reverse;
            overflow: hidden;
        }
    }
</style>
