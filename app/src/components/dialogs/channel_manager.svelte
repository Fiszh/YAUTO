<script lang="ts">
    import Dialog from "$components/Dialog.svelte";
    import Button from "$components/Inputs/Button.svelte";
    import Checkbox from "$components/Inputs/Checkbox.svelte";
    import Input from "$components/Inputs/Input.svelte";
    import Kick from "$components/logos/kick.svelte";
    import Twitch from "$components/logos/twitch.svelte";
    import Youtube from "$components/logos/youtube.svelte";
    import { addToast } from "$lib/toast";
    import { API_URL } from "$stores/global";
    import { t } from "svelte-i18n";
    import { slide } from "svelte/transition";

    type InputMode = "name" | "id" | string; // im to lazy to fix this rn so i will leave string here

    interface PlatformInput {
        input: {
            name: string;
            id: string;
        };
        mode: InputMode;
    }

    type Props = {
        show: boolean;
        inputs: Record<Lowercase<Platforms>, PlatformInput>;
    };

    let { show = $bindable(false), inputs = $bindable() }: Props = $props();

    interface PastedName {
        name: string;
        platform: Platforms;
        input: Platforms;
    }

    const emptyPastedName: PastedName = {
        name: "",
        platform: "TWITCH",
        input: "TWITCH",
    };

    let pastedName = $state(emptyPastedName);

    function validateInput(value: string, type: string) {
        if (type == "number") {
            return value.replace(/[^0-9]+/g, "");
        } else if (type == "twitch_name") {
            return value.replace(/[^a-zA-Z0-9_]+/g, "");
        } else if (type == "kick_name") {
            return value.replace(/[^a-zA-Z0-9-]+/g, "");
        } else if (type == "youtube_id") {
            return value.replace(/[^a-zA-Z0-9_-]+/g, "");
        } else if (type == "youtube_handle") {
            return value.replace(/[^a-zA-Z0-9_.@-]+/g, "");
        }
        return value;
    }

    function checkForChannelLink(e: ClipboardEvent) {
        if (e.clipboardData && e.target instanceof HTMLInputElement) {
            const pastedText = e.clipboardData.getData("text").trim();

            let pasted_url: URL;
            try {
                pasted_url = new URL(pastedText);
            } catch {
                return;
            }

            const pastedUsername = pasted_url.pathname
                .split("/")
                .filter(Boolean)[0];

            if (!pastedUsername) return;

            if (pasted_url.host.endsWith("twitch.tv")) {
                pastedName = {
                    name: pastedUsername,
                    platform: "TWITCH",
                    input: e.target.dataset.platform as Platforms,
                };
            } else if (pasted_url.host.endsWith("kick.com")) {
                pastedName = {
                    name: pastedUsername,
                    platform: "KICK",
                    input: e.target.dataset.platform as Platforms,
                };
            } else if (pasted_url.host.endsWith("youtube.com")) {
                pastedName = {
                    name: pastedUsername,
                    platform: "GOOGLE",
                    input: e.target.dataset.platform as Platforms,
                };
            }
        }
    }

    const toTitleCase = (str: string): string =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    function setPastedName() {
        if (pastedName["platform"] == "TWITCH")
            inputs["twitch"]["input"]["name"] = pastedName["name"];

        if (pastedName["platform"] == "KICK")
            inputs["kick"]["input"]["name"] = pastedName["name"];

        if (pastedName["platform"] == "GOOGLE")
            inputs["google"]["input"]["name"] = pastedName["name"];

        if (pastedName["input"] != pastedName["platform"]) {
            inputs[pastedName["input"].toLowerCase() as Lowercase<Platforms>][
                "input"
            ]["name"] = "";
        }

        pastedName = emptyPastedName;
    }

    async function handleSave() {
        if (inputs["google"]["mode"] == "name") {
            let handle = inputs["google"]["input"]["name"].trim();

            if (!handle.length)
                return addToast({
                    msg: "No YouTube handle inputed!",
                    type: "error",
                    timeout: 5,
                });

            addToast({
                msg: "Resolving your handle, please wait.",
                timeout: 5,
            });

            if (!handle.startsWith("@")) handle = "@" + handle;

            const res = await fetch(
                API_URL + "/youtube/resolve/" + encodeURIComponent(handle),
            );

            if (!res.ok)
                return addToast({
                    msg: "Failed resolving YouTube handle!",
                    type: "error",
                    timeout: 5,
                });

            inputs["google"]["input"]["id"] = await res.text();
            inputs["google"]["input"]["name"] = "";
            inputs["google"]["mode"] = "id";
        }

        addToast({
            msg: "Saved channel info!",
            type: "success",
            timeout: 5,
        });
        show = false;
    }
</script>

{#snippet channelLinkButtons()}
    <Button onclick={() => (pastedName = emptyPastedName)}>
        {$t("labels.cancel")}
    </Button>

    <Button primary onclick={setPastedName}>{$t("labels.confirm")}</Button>
{/snippet}

<Dialog
    name={$t("dialogs.channel_link.title")}
    show={pastedName["name"].length > 0}
    buttons={channelLinkButtons}
    onClose={() => (pastedName = emptyPastedName)}
    index={1}
>
    <h3>
        {$t("dialogs.channel_link.description", {
            values: { platform: toTitleCase(pastedName["platform"]) },
        })}
    </h3>
    <p>
        {#if pastedName["platform"] == pastedName["input"]}
            {$t("dialogs.channel_link.channel_confirm", {
                values: {
                    name: pastedName["name"],
                },
            })}
        {:else}
            {$t("dialogs.channel_link.platform_change", {
                values: {
                    platform: toTitleCase(pastedName["platform"]),
                    name: pastedName["name"],
                },
            })}
        {/if}
    </p>
</Dialog>

<Dialog bind:show name={$t("dialogs.manage_channels.title")} hideClose>
    <div id="layout">
        <section>
            <p>
                <Twitch brandColor />
                Twitch
            </p>

            {#if inputs.twitch.mode == "name"}
                <Input
                    bind:value={inputs["twitch"]["input"]["name"]}
                    placeholder={$t("channel_input.name", {
                        values: {
                            platform: "",
                        },
                    }).trim() + "..."}
                    data-platform="TWITCH"
                    invalid={!inputs["twitch"]["input"]["name"].length}
                    onPaste={checkForChannelLink}
                    onChange={(e) =>
                        (inputs["twitch"]["input"]["name"] = validateInput(
                            (e.currentTarget as HTMLInputElement).value,
                            "twitch_name",
                        ))}
                />
            {:else}
                <Input
                    bind:value={inputs["twitch"]["input"]["id"]}
                    placeholder={$t("channel_input.id", {
                        values: {
                            platform: "",
                        },
                    }).trim() + "..."}
                    invalid={!inputs["twitch"]["input"]["id"].length}
                    onChange={(e) =>
                        (inputs["twitch"]["input"]["id"] = validateInput(
                            (e.currentTarget as HTMLInputElement).value,
                            "number",
                        ))}
                />
            {/if}

            <Checkbox
                checked={inputs.twitch.mode == "id"}
                onchange={(e) =>
                    (inputs.twitch.mode = (e.target as HTMLInputElement).checked
                        ? "id"
                        : "name")}
            >
                {$t("dialogs.manage_channels.use_channel_id")}
            </Checkbox>
        </section>

        <section>
            <p>
                <Kick brandColor />
                Kick
            </p>

            {#if inputs.kick.mode == "name"}
                <Input
                    bind:value={inputs["kick"]["input"]["name"]}
                    placeholder={$t("channel_input.name", {
                        values: {
                            platform: "",
                        },
                    }).trim() + "..."}
                    data-platform="KICK"
                    invalid={!inputs["kick"]["input"]["name"].length}
                    onPaste={checkForChannelLink}
                    onChange={(e) =>
                        (inputs["kick"]["input"]["name"] = validateInput(
                            (e.currentTarget as HTMLInputElement).value,
                            "kick_name",
                        ))}
                />
            {:else}
                <Input
                    bind:value={inputs["kick"]["input"]["id"]}
                    placeholder={$t("channel_input.id", {
                        values: {
                            platform: "",
                        },
                    }).trim() + "..."}
                    invalid={!inputs["kick"]["input"]["id"].length}
                    onChange={(e) =>
                        (inputs["twitch"]["input"]["id"] = validateInput(
                            (e.currentTarget as HTMLInputElement).value,
                            "number",
                        ))}
                />
            {/if}

            <Checkbox
                disabled
                checked={inputs.kick.mode == "id"}
                onchange={(e) =>
                    (inputs.kick.mode = (e.target as HTMLInputElement).checked
                        ? "id"
                        : "name")}
            >
                {$t("dialogs.manage_channels.use_channel_id")}
            </Checkbox>
        </section>

        <section>
            <p>
                <Youtube brandColor />
                YouTube
            </p>

            {#if inputs.google.mode == "id"}
                <Input
                    bind:value={inputs["google"]["input"]["id"]}
                    placeholder={$t("channel_input.id", {
                        values: {
                            platform: "",
                        },
                    }).trim() + "..."}
                    data-platform="GOOGLE"
                    invalid={!inputs["google"]["input"]["id"].length ||
                        !inputs["google"]["input"]["id"].startsWith("UC")}
                    onPaste={checkForChannelLink}
                    onChange={(e) =>
                        (inputs["google"]["input"]["id"] = validateInput(
                            (e.currentTarget as HTMLInputElement).value,
                            "youtube_id",
                        ))}
                />
            {:else}
                <Input
                    bind:value={inputs["google"]["input"]["name"]}
                    placeholder={$t("channel_input.handle", {
                        values: {
                            platform: "",
                        },
                    }).trim() + "..."}
                    invalid={!inputs["google"]["input"]["name"].length}
                    onChange={(e) =>
                        (inputs["google"]["input"]["name"] = validateInput(
                            (e.currentTarget as HTMLInputElement).value,
                            "youtube_handle",
                        ))}
                />
            {/if}
            {#if inputs.google.mode == "name"}
                <small style="color: var(--danger-hover);" transition:slide>
                    YouTube handle will be resolved after pressing save.
                </small>
            {/if}

            <Checkbox
                // disabled
                checked={inputs.google.mode == "name"}
                onchange={(e) =>
                    (inputs.google.mode = (e.target as HTMLInputElement).checked
                        ? "name"
                        : "id")}
            >
                {$t("dialogs.manage_channels.use_channel_handle")}
            </Checkbox>
        </section>

        <Button primary wide center onclick={handleSave}>
            {$t("labels.save")}
        </Button>
    </div>
</Dialog>

<style lang="scss">
    #layout {
        section {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            p {
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
        }
    }
</style>
