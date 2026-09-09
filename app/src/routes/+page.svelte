<script>
    import { onMount } from "svelte";

    import ChatOverlay from "../components/ChatOverlay.svelte";

    import LoadingUI from "../components/Loading.svelte";

    import { loadingInfo } from "$stores/global";
    import Main from "$components/Main/Chat/Main.svelte";
    import { get } from "svelte/store";

    let LoadingMsg = $state(get(loadingInfo));

    loadingInfo.subscribe((value) => (LoadingMsg = value));

    let mounted = $state(false);
    let hasChannel = $state(false);

    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        hasChannel =
            params.has("channel") ||
            params.has("id") ||
            params.has("kick") ||
            params.has("youtube");

        const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

        if (isFirefox) {
            document.documentElement.style.setProperty(
                "--scrollbar-width",
                "auto",
            );
            document.documentElement.style.setProperty(
                "--scrollbar-color",
                "rgb(255,255,255) rgb(10,10,10)",
            );
        }

        mounted = true;

        const hasError = params.get("error");

        if (hasError && hasError == "redirect_mismatch")
            alert("Are you on the right site? Please log in at chat.unii.dev.");
    });
</script>

{#if mounted}
    {#if hasChannel}
        <LoadingUI text={LoadingMsg.text} type={LoadingMsg.type} />

        <ChatOverlay />
    {:else}
        <Main />
    {/if}
{/if}

<noscript style="color:black;">
    <div>
        <h1>JavaScript is disabled</h1>
        <p>This app requires JavaScript to work.</p>
        <p>Enable JavaScript to use the app.</p>
    </div>
</noscript>

<style lang="scss">
    noscript div {
        width: 100%;
        height: 100%;
        background-color: black;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        p {
            margin: 0;
        }

        h1 {
            margin: 0.2rem;
        }
    }
</style>
