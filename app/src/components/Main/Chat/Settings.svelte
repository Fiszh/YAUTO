<script lang="ts">
    import { get } from "svelte/store";

    import { parseSavedSettings } from "$lib/overlayIndex";

    import Dialog from "$components/Dialog.svelte";

    import { savedSettings, type Setting, settings } from "$stores/settings";
    import Button from "$components/Inputs/Button.svelte";
    import SettingsToggle from "$components/settings/Settings-toggle.svelte";
    import SettingsText from "$components/settings/Settings-text.svelte";
    import SettingsColor from "$components/settings/Settings-color.svelte";
    import SettingsSlider from "$components/settings/Settings-slider.svelte";
    import SettingsSelector from "$components/settings/Settings-selector.svelte";
    import { removeParam, setParam } from "$lib/params";
    import { t } from "svelte-i18n";
    import SettingsDropdown from "$components/settings/Settings-dropdown.svelte";

    let showHidden = $state(false);
    let hiddenWarning = $state(false);

    const showHiddenSettings = () => {
        showHidden = true;
        hiddenWarning = true;
    };

    const rawLocalSettings = localStorage.getItem("local-settings");
    const LocalSettings = rawLocalSettings
        ? JSON.parse(rawLocalSettings)
        : null;

    if (LocalSettings) parseSavedSettings(LocalSettings);

    function handleInput(
        param: string,
        value: Setting["value"],
        type?: string,
    ) {
        settings.update((arr) => {
            const found = arr.find((s) => s.param === param);

            if (found) {
                if (type == "number") {
                    found.value = String(value).replace(/[^0-9]+/g, "");
                } else if (
                    typeof value == "boolean" ||
                    typeof value == "string"
                ) {
                    found.value = value;
                } else {
                    found.value = found.default as Setting["value"];
                }
            }

            return arr;
        });
    }

    settings.subscribe((arr) => {
        const saved_settings = get(savedSettings);

        for (const setting of arr) {
            if (
                typeof setting.value != undefined &&
                (typeof setting.value == "string" ? setting.value : true) &&
                setting.value !=
                    (saved_settings[setting.param]
                        ? saved_settings[setting.param]
                        : setting.default)
            ) {
                setParam(setting.param, setting.value);
            } else {
                removeParam(setting.param);
            }
        }
    });
</script>

<Dialog name={$t("dialogs.hidden_settings.title")} bind:show={hiddenWarning}>
    {$t("dialogs.hidden_settings.description")}
</Dialog>

<div id="settings">
    {#each $settings as setting, i (i)}
        {#if !setting.hide || (setting.hide && showHidden)}
            {#if setting.type == "boolean"}
                <SettingsToggle
                    hidden={setting.hide}
                    value={setting.value}
                    param={setting.param}
                    defaultValue={setting["default"]}
                    onChange={(checked) => handleInput(setting.param, checked)}
                />
            {:else if setting.type == "text" || setting.type == "number"}
                <SettingsText
                    hidden={setting.hide}
                    value={setting.value}
                    param={setting.param}
                    defaultValue={setting["default"]}
                    onChange={(value) =>
                        handleInput(
                            setting.param,
                            value,
                            typeof setting["default"],
                        )}
                />
            {:else if setting.type == "color-picker"}
                <SettingsColor
                    hidden={setting.hide}
                    value={setting.value}
                    param={setting.param}
                    defaultValue={setting["default"]}
                    onChange={(value) =>
                        handleInput(setting.param, value, "color-picker")}
                />
            {:else if setting.type == "slider"}
                <SettingsSlider
                    hidden={setting.hide}
                    value={setting.value}
                    param={setting.param}
                    min={setting["min"]}
                    max={setting["max"]}
                    defaultValue={setting["default"]}
                    onChange={(value) =>
                        handleInput(setting.param, value, "slider")}
                />
            {:else if setting.type == "selector"}
                <SettingsSelector
                    hidden={setting.hide}
                    value={setting.value}
                    param={setting.param}
                    selectors={setting.selectors}
                    defaultValue={setting.default}
                    onChange={(value) =>
                        handleInput(
                            setting.param,
                            value,
                            typeof setting["default"],
                        )}
                />
            {:else if setting.type == "dropdown"}
                <SettingsDropdown
                    hidden={setting.hide}
                    value={setting.value}
                    list={setting["list"]}
                    param={setting.param}
                    defaultValue={setting["default"]}
                    onChange={(value) =>
                        handleInput(
                            setting.param,
                            value,
                            typeof setting["default"],
                        )}
                />
            {/if}

            <hr />
        {/if}
    {/each}

    {#if !showHidden}
        <Button id="hidden-settings" center danger onclick={showHiddenSettings}>
            {$t("settings.show_hidden")}
        </Button>
    {/if}
</div>

<style lang="scss">
    #settings {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;

        background-color: rgba(255, 255, 255, 0.021);

        border-right: #242424 1px solid;
    }

    @media (max-width: 768px) {
        #settings {
            font-size: 0.75rem;
        }
    }
</style>
