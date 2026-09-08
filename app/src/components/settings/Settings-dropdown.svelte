<script lang="ts">
    import SettingsWrapper from "./Settings-wrapper.svelte";
    import { isMobile } from "$stores/global";
    import { onMount } from "svelte";
    import type { DropdownSetting } from "$stores/settings";
    import Dropdown from "$components/Inputs/Dropdown.svelte";
    import Button from "$components/Inputs/Button.svelte";

    type Props = {
        onChange: (value: string) => void;
        hidden?: boolean;
        value: string;
        list: DropdownSetting["list"];
        defaultValue?: Props["value"];
        param: string;
    };

    let items = $state<string[]>([]);

    function handleChange(e: Event) {
        if (typeof onChange == "undefined") return;

        if (e.currentTarget instanceof HTMLInputElement)
            onChange(e.currentTarget.value);
    }

    let { onChange, value, list, hidden, defaultValue, param }: Props =
        $props();

    // default will be set to starter value if not set in props
    const handleReset = () => {
        value = defaultValue!;
        onChange(String(defaultValue));
    };
    onMount(() => {
        if (typeof defaultValue == "undefined") defaultValue = value;

        if (defaultValue == value) {
            value = "";
            onChange(value);
        }

        if (Array.isArray(list)) items = list;
    });
</script>

{#snippet dropdown()}
    <Button>{defaultValue}</Button>
    {#each items as item}
        <Button>{item}</Button>
    {/each}
{/snippet}

<SettingsWrapper
    {param}
    {hidden}
    column={$isMobile}
    {value}
    settingsDefault={""}
    onReset={handleReset}
>
    {#if typeof list == "function" && !items.length}
        <div id="layout">
            <Button primary onclick={async () => (items = await list())}>
                Load
            </Button>
            <Dropdown
                {dropdown}
                searchable
                placeholder={String(defaultValue)}
                value={defaultValue}
            >
                hi
            </Dropdown>
        </div>
    {:else}
        <Dropdown {dropdown} searchable placeholder={String(defaultValue)}>
            {value.length ? value : defaultValue}
        </Dropdown>
    {/if}
</SettingsWrapper>

<style lang="scss">
    div {
        display: flex;
        gap: 0.5rem;
    }
</style>
