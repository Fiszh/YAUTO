<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLInputAttributes } from "svelte/elements";

    interface Props extends HTMLInputAttributes {
        checked?: boolean;
        disabled?: boolean;
        children: Snippet;
    }

    let {
        checked = $bindable(false),
        disabled = false,
        children,
        ...rest
    }: Props = $props();
</script>

<label class:disabled>
    <input type="checkbox" bind:checked {...rest} {disabled} />
    {@render children()}
</label>

<style lang="scss">
    label {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        cursor: pointer;

        user-select: none;

        & > * {
            cursor: pointer;
        }

        &:hover input {
            background-color: var(--secondary-hover);
        }

        input {
            appearance: none;
            width: 1rem;
            aspect-ratio: 1;
            background-color: var(--secondary);

            border: 0.15rem var(--secondary-active) solid;
            border-radius: 0.25rem;
            transition: background-color 0.2s ease;

            &:checked {
                background-color: var(--accent);
                border-color: var(--secondary-active);
            }
        }
    }

    @media (max-width: 768px) {
        label input {
            width: 0.75rem;
            border-radius: 0.15rem;
        }
    }
</style>
