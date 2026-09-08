<script lang="ts">
    import { X } from "@lucide/svelte";
    import type { Snippet } from "svelte";
    import Button from "./Inputs/Button.svelte";

    type Props = {
        name: string;
        show: boolean;
        index?: number;
        width?: number;
        hideClose?: boolean;
        buttons?: Snippet;
        children: Snippet;
        onClose?: () => void;
    };

    let {
        name,
        show = $bindable(false),
        index = 0,
        width = 25,
        hideClose = false,
        buttons,
        onClose,
        children,
    }: Props = $props();

    const close = () => {
        show = false;

        onClose?.();
    };
</script>

{#if show}
    <section
        class="dialog"
        style="z-index: {2 + index}; min-width: {width}rem;"
    >
        <span id="header">
            <p>{name}</p>
            {#if !hideClose}
                <Button onclick={close}><X /></Button>
            {/if}
        </span>
        <hr />
        <section id="content">{@render children()}</section>
        {#if typeof buttons != "undefined"}
            <hr />
            <section id="buttons">{@render buttons()}</section>
        {/if}
    </section>
    <section id="site-blackout" style="z-index: {1 + index};"></section>
{/if}

<style lang="scss">
    #site-blackout {
        position: absolute;
        height: 100vw;
        height: 100vh;
        width: 100dvw;
        height: 100dvh;
        top: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.5);
    }

    .dialog {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #0a0a0a;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);

        // overflow: hidden;

        display: flex;
        flex-direction: column;
        max-width: 30rem;
        max-height: 25rem;

        border-radius: 0.5rem;

        & > *:not(hr) {
            padding: 0.5rem 1rem;
            box-sizing: border-box;
            // outline: 1px red solid;
        }

        #header {
            margin: 0;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
            font-weight: bold;
        }

        #buttons {
            display: inline-flex;
            justify-content: space-between;

            padding-block: 0.5rem;

            & > :global(*) {
                display: inline-flex;
                gap: 0.5rem;
            }
        }
    }

    @media (max-width: 768px) {
        .dialog {
            max-width: unset;
            max-height: unset;

            border-radius: unset;

            width: 100%;
            height: 100%;
        }
    }
</style>
