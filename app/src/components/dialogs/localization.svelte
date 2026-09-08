<script lang="ts">
    import CountryFlag from "$components/CountryFlag.svelte";
    import type { FlagCode } from "$components/CountryFlag.svelte";
    import Dialog from "$components/Dialog.svelte";
    import Button from "$components/Inputs/Button.svelte";
    import Dropdown from "$components/Inputs/Dropdown.svelte";
    import { localeNames } from "$lib/i18n";
    import { locale, t } from "svelte-i18n";

    type Props = {
        show: boolean;
    };

    let { show = $bindable(false) }: Props = $props();

    let currentCode = $state<FlagCode>("en");

    const typedEntries = Object.entries(localeNames) as [FlagCode, string][];

    locale.subscribe(
        (l) => (currentCode = (l as FlagCode | undefined) ?? "en"),
    );
</script>

{#snippet icon()}
    <CountryFlag code={currentCode} height={15} />
{/snippet}

{#snippet dropdown()}
    {#each typedEntries as [code, name]}
        {#snippet icon()}
            <CountryFlag {code} height={15} />
        {/snippet}
        <Button {icon} onclick={() => ($locale = code)}>{name}</Button>
    {/each}
{/snippet}

<Dialog bind:show name={$t("dialogs.localization.title")}>
    <div id="layout">
        <p>
            {$t("dialogs.localization.description")}
        </p>
        <Dropdown {icon} {dropdown}>{localeNames[currentCode]}</Dropdown>
        <Button primary wide center onclick={() => (show = false)}>
            {$t("labels.save")}
        </Button>
        <small>
            Want to help us translate? Click
            <a href="/translate" target="_blank" rel="noopener noreferrer">
                here
            </a>
        </small>
    </div>
</Dialog>

<style lang="scss">
    #layout {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        small {
            display: inline;
            text-align: center;

            opacity: 0.75;

            a {
                display: inline;
            }
        }
    }
</style>
