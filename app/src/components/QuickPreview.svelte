<script lang="ts">
    import ChatDisplay from "./ChatDisplay.svelte";
    import { messages } from "$lib/chat";
    import { quickPreviewMessages } from "$stores/previewMessages";
    import { onMount } from "svelte";

    messages.set(quickPreviewMessages);
    onMount(() => messages.set(quickPreviewMessages));
</script>

<div id="quick-preview">
    <strong id="top">Quick Preview</strong>
    <ChatDisplay
        customStyle="--chat-font-size: 13px; --chat-emote-size: 15px;"
    />
</div>

<style lang="scss">
    #quick-preview {
        display: flex;
        flex-direction: column;

        user-select: none;
        border-bottom: #242424 1px solid;

        #top {
            border-bottom: #242424 1px solid;

            padding: 0.25rem 0.5rem;
            box-sizing: border-box;
        }

        :global(.chat) {
            height: 100% !important;
            padding: 0.2rem 0.4rem;
            box-sizing: border-box;
            position: relative !important;
            background-color: var(--chat-background);
        }
    }
</style>
