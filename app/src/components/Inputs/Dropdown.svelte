<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";
    import { ChevronDown, ChevronUp } from "@lucide/svelte";

    type Props = {
        icon?: Snippet;
        dropdown?: Snippet;
        children?: Snippet;
        value?: string;
        reversed?: boolean;
        searchable?: boolean;
    } & HTMLAttributes<HTMLDivElement>;

    let expanded = $state(false);

    let {
        icon,
        dropdown,
        children,
        value,
        reversed = false,
        searchable = false,
        ...restProps
    }: Props = $props();

    const toggle = () => (expanded = !expanded);

    const handleMouseEnter = () => (expanded = true);

    const close = () => (expanded = false);

    const handleMouseLeave = close;
</script>

<!-- TODO DISPLAY VALUE WHEN SEARCHABLE IS ENABLED -->
<div
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    class:expanded
    class:reversed
    onclick={toggle}
    {...restProps}
    role="none"
    class="dropdown"
>
    {#if !searchable}
        <button id="top">
            {@render icon?.()}
            <span id="child-render">{@render children?.()}</span>
            {#if !expanded}
                <ChevronDown size="1rem" />
            {:else}
                <ChevronUp size="1rem" />
            {/if}
        </button>
    {:else}
        <label id="top">
            {@render icon?.()}
            <input />
            {#if !expanded}
                <ChevronDown size="1rem" />
            {:else}
                <ChevronUp size="1rem" />
            {/if}
        </label>
    {/if}
    <span id="dropdown">
        {@render dropdown?.()}
    </span>
</div>

{#if __DEBUG__}
    <style lang="scss">
        .dropdown,
        .dropdown > * {
            outline: white 1px solid;
            background-color: red;
        }
    </style>
{/if}

<style lang="scss">
    div {
        display: flex;
        flex-direction: column;
        background-color: var(--secondary);

        border-radius: 10px;

        position: relative;

        cursor: pointer;

        white-space: nowrap;

        min-width: 15rem;

        input {
            height: 100%;
            width: 100%;
            outline: none;
            border: none;
            background: none;
            color: white;
        }

        #child-render {
            width: 100%;
            text-align: left;
        }

        #dropdown {
            display: flex;
            flex-direction: column;

            box-sizing: border-box;

            z-index: 9999;

            max-height: 0px;
            overflow: hidden;

            border-radius: 0px 0px 10px 10px;

            position: absolute;
            top: 100%;

            background-color: var(--secondary);

            width: 100%;
            max-width: 100%;

            white-space: normal; // undo inherited nowrap

            overflow-y: auto;
            overflow-x: hidden;
        }

        &.expanded {
            border-radius: 10px 10px 0px 0px;

            #dropdown {
                border-top: var(--secondary-active) 2px solid;

                max-height: 20vh;
                max-height: 20dvh;
            }
            &.reversed #dropdown {
                flex-direction: column-reverse;
            }
        }
    }

    #top {
        background: none;
        border: none;
        color: currentColor;
        display: inline-flex;
        align-items: center;
        font-size: inherit;
        cursor: inherit;
        gap: 0.5rem;
        padding: 0.5rem;
    }
</style>
