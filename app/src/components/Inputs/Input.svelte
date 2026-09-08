<script lang="ts">
    import type { Snippet } from "svelte";
    import type {
        HTMLInputAttributes,
        HTMLAnchorAttributes,
    } from "svelte/elements";

    import { X, Ban } from "@lucide/svelte";
    import { fade } from "svelte/transition";

    type Props = {
        icon?: Snippet;
        iconRight?: Snippet;
        children?: Snippet;
        value?: string | number;
        disabled?: boolean;
        wide?: boolean;
        invalid?: boolean;
        readonly?: boolean;
        onChange?: (e: Event) => void;
        onPaste?: (e: ClipboardEvent) => void;
    } & HTMLInputAttributes &
        HTMLAnchorAttributes;

    let {
        icon,
        iconRight,
        value = $bindable(""),
        disabled = false,
        wide = false,
        invalid = false,
        readonly = false,
        onChange,
        onPaste,
        ...restProps
    }: Props = $props();

    const clear = () => {
        value = "";
    };
</script>

<label class:disabled class:wide class:invalid class:readonly>
    {#if !disabled}
        {@render icon?.()}
    {:else}
        <Ban size="1rem" color="currentColor" />
    {/if}
    <input
        bind:value
        {disabled}
        {readonly}
        oninput={onChange}
        onpaste={onPaste}
        {...restProps}
        placeholder={disabled ? "Disabled" : restProps.placeholder}
    />
    {#if !disabled}
        <span id="rightIcon" transition:fade>
            {#if iconRight && !value.length}
                {@render iconRight()}
            {:else if value.length && !readonly}
                <button title="Clear" onclick={clear}><X size="1rem" /></button>
            {/if}
        </span>
    {/if}
</label>

<style lang="scss">
    label {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;

        background-color: var(--secondary);

        border: 0.15rem var(--secondary-active) solid;
        border-radius: 0.25rem;
        padding: 0.25rem;

        cursor: text;

        &.wide {
            width: 100%;
        }

        input {
            width: 100%;
        }

        &:not(.readonly) {
            &:hover {
                background-color: var(--secondary-active);
                border-color: var(--text-light);
            }

            &:focus-within {
                border-color: var(--text-light);
            }
        }

        &.invalid {
            border-color: var(--danger-hover);
            color: var(--danger-hover);
        }

        span,
        button {
            background-color: transparent;
            border: none;
            color: currentColor;
            cursor: pointer;
            padding: 0rem;
            display: inline-flex;
        }

        span {
            height: 1rem;
            aspect-ratio: 1;
            cursor: unset;
        }

        input {
            background-color: transparent;
            border: none;
            color: currentColor;

            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            cursor: inherit;

            &:focus {
                outline: none;
            }
        }
    }
</style>
