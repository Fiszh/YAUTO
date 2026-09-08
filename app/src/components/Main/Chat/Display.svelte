<script lang="ts">
    import { RotateCcw, Copy, Send, ShieldPlus } from "@lucide/svelte";
    import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker";

    import { messages, sanitizeInput } from "$lib/chat";

    import ChatDisplay from "$components/ChatDisplay.svelte";

    import { configs, settings, settingsParams } from "$stores/settings";

    import { previewMessages } from "$stores/previewMessages";
    import { sendFakeMessage } from "$lib/preview";
    import Button from "$components/Inputs/Button.svelte";
    import Input from "$components/Inputs/Input.svelte";
    import Color from "$components/Inputs/Color.svelte";
    import { removeParam, setParam } from "$lib/params";
    import { isMobile } from "$stores/global";
    import { initBadges } from "$lib/loadChat";
    import { addToast } from "$lib/toast";
    import HelpNotice from "$components/helpNotice.svelte";
    import { t } from "svelte-i18n";
    import ChannelManager from "$components/dialogs/channel_manager.svelte";
    import CalloutBubble from "$components/CalloutBubble.svelte";
    import { shake } from "$lib/shake";
    import Pogly from "$components/logos/pogly.svelte";
    import PoglyWidget from "$components/dialogs/pogly_widget.svelte";

    let hex = $state("#191919");
    let customMessageValue = $state("");

    let channelInfo = $state({
        twitch: {
            input: {
                name: "",
                id: "",
            },
            mode: "name",
        },
        kick: {
            input: {
                name: "",
                id: "",
            },
            mode: "name",
        },
        google: {
            input: {
                name: "",
                id: "",
            },
            mode: "id",
        },
    });

    let showChannelManager = $state(false);
    let showAttentionManager = $state(false);
    let channelManagerButton = $state<HTMLButtonElement | HTMLAnchorElement>();

    let showPoglyDialog = $state(false);

    const params = $derived(
        new URLSearchParams(
            Object.entries($settingsParams).map(([k, v]) => [
                k,
                String(typeof v == "boolean" ? Number(v) : v),
            ]),
        ),
    );

    let urlResults: string = $derived(
        window.location.origin +
            "/" +
            (params.toString().length ? "?" : "") +
            params,
    );

    const resetSettings = () => {
        channelInfo["twitch"]["input"]["name"] = "";
        channelInfo["twitch"]["input"]["id"] = "";

        channelInfo["kick"]["input"]["name"] = "";
        channelInfo["kick"]["input"]["id"] = "";

        channelInfo["google"]["input"]["name"] = "";
        channelInfo["google"]["input"]["id"] = "";

        settings.set(
            configs.map((c) => {
                if (c["type"] == "text" || c["type"] == "number") {
                    c["value"] = "";
                    return c;
                } else {
                    return c;
                }
            }),
        );

        settingsParams.set({});

        params.forEach((_, key) => params.delete(key));

        messages.set(previewMessages);

        hex = "#191919";
    };

    function copyUrl() {
        if (urlResults) {
            if (
                $settingsParams["channel"] ||
                $settingsParams["id"] ||
                $settingsParams["kick"] ||
                $settingsParams["youtube"]
            ) {
                navigator.clipboard
                    .writeText(urlResults)
                    .then(() => {
                        alert($t("toasts.url_copied"));
                    })
                    .catch((err) => {
                        console.error("Failed to copy URL: ", err);
                    });
            } else {
                showAttentionManager = true;
                if (channelManagerButton) shake(channelManagerButton);
            }
        }
    }

    function addMessage() {
        if (!customMessageValue.trim().length) return;

        const message = sanitizeInput(customMessageValue);

        if (!message.length) return;

        sendFakeMessage(message);
    }

    function loadMoreBadges() {
        addToast({ msg: $t("toasts.loading_badges") });

        initBadges()
            .then(() =>
                addToast({ msg: $t("toasts.loaded_badges"), type: "success" }),
            )
            .catch(() =>
                addToast({ msg: $t("toasts.fail_load_badges"), type: "error" }),
            )
            .finally(() => messages.set(previewMessages));
    }

    $effect(() =>
        channelInfo["twitch"]["input"]["name"].length &&
        (!channelInfo["twitch"]["input"]["id"].length ||
            channelInfo["twitch"]["mode"] != "id")
            ? setParam(
                  "channel",
                  String(channelInfo["twitch"]["input"]["name"]),
              )
            : removeParam("channel"),
    );

    $effect(() =>
        channelInfo["twitch"]["input"]["id"].length &&
        (!channelInfo["twitch"]["input"]["name"].length ||
            channelInfo["twitch"]["mode"] == "id")
            ? setParam("id", String(channelInfo["twitch"]["input"]["id"]))
            : removeParam("id"),
    );

    $effect(() =>
        channelInfo["kick"]["input"]["name"].length
            ? setParam("kick", String(channelInfo["kick"]["input"]["name"]))
            : removeParam("kick"),
    );

    $effect(() =>
        channelInfo["google"]["input"]["id"].length
            ? setParam(
                  "youtube",
                  encodeURIComponent(
                      String(channelInfo["google"]["input"]["id"]),
                  ),
              )
            : removeParam("youtube"),
    );
</script>

<ChannelManager bind:show={showChannelManager} inputs={channelInfo} />

<PoglyWidget bind:show={showPoglyDialog} />

{#snippet loadBadgesIcon()}
    <ShieldPlus size={$isMobile ? "1rem" : "1.5rem"} />
{/snippet}
{#snippet resetSettingsIcon()}
    <RotateCcw size={$isMobile ? "1rem" : "1.5rem"} />
{/snippet}
{#snippet PoglyIcon()}
    <Pogly brandColor size={$isMobile ? "1rem" : "1.5rem"} />
{/snippet}

<div id="chat-preview" style="--chat-background: {hex}">
    <section id="top">
        <h4>{$t("display.top.title")}</h4>
        <small>{$t("display.top.description")}</small>
    </section>
    <section id="chat-display" class="bg-grid">
        {#if !$isMobile}
            <ChatDisplay />
        {:else}
            <ChatDisplay customStyle="--chat-font-size: 15px;" />
        {/if}
    </section>
    <section id="bottom">
        <span class="header">
            <p>{$t("display.bottom.header.title")}</p>

            <div id="buttons">
                <Button
                    onclick={loadMoreBadges}
                    icon={loadBadgesIcon}
                    title={$t("display.bottom.header.load_badges.mobile")}
                >
                    {$isMobile
                        ? $t("display.bottom.header.load_badges.mobile")
                        : $t("display.bottom.header.load_badges.pc")}
                </Button>
                <Button
                    onclick={resetSettings}
                    icon={resetSettingsIcon}
                    title="Reset Settings"
                >
                    {$t("labels.reset")}
                </Button>
            </div>
        </span>
        <hr />
        <section id="color-picker">
            <small class="title">
                {$t("display.bottom.chat_background.title")}
            </small>

            <div class="display">
                <Color bind:value={hex} />
            </div>
        </section>
        <hr />
        <section>
            <small class="title">
                {$t("display.bottom.custom_message.title")}
            </small>

            <div class="display">
                {#snippet icon()}
                    <Send size={$isMobile ? "1.5rem" : "2rem"} />
                {/snippet}

                <Input
                    wide
                    bind:value={customMessageValue}
                    placeholder={$t(
                        "display.bottom.custom_message.input_placeholder",
                    )}
                />

                <Button secondary onclick={addMessage} {icon}>
                    {$t("labels.send")}
                </Button>
            </div>
        </section>
        <hr />
        <section>
            <small class="title">
                {$t("display.bottom.channel_info.title")}
            </small>
            <div class="display">
                <Button
                    primary
                    wide
                    onclick={() => {
                        showChannelManager = true;
                        showAttentionManager = false;
                    }}
                    type="button"
                    bind:element={channelManagerButton}
                >
                    {#if showAttentionManager}
                        <CalloutBubble type="error">
                            {$t("labels.input_required")}
                        </CalloutBubble>
                    {/if}
                    {$t("display.bottom.channel_info.manage")}
                </Button>
            </div>
        </section>
        <hr />
        <section id="overlay-url">
            <small class="title">
                {$t("display.bottom.overlay_url.title")}
            </small>

            <div class="display">
                {#snippet icon()}
                    <Copy size={$isMobile ? "1.5rem" : "2rem"} />
                {/snippet}

                <Input wide readonly bind:value={urlResults} />
                <Button primary onclick={copyUrl} {icon}>
                    {$t("labels.copy")}
                </Button>
                <Button
                    title="Use as Pogly widget"
                    secondary
                    icon={PoglyIcon}
                    onclick={() => (showPoglyDialog = true)}
                />
            </div>
        </section>
    </section>
    <HelpNotice>{$t("notices.ip")}</HelpNotice>
</div>

<style lang="scss">
    @use "sass:color";

    :root {
        --chat-background: #191919;
    }

    #chat-preview {
        max-width: 30rem;
        width: 100%;

        display: flex;
        flex-direction: column;

        height: 100%;

        user-select: none;

        background-color: rgba(255, 255, 255, 0.01);

        #chat-display {
            display: flex;
            height: 100%;

            min-height: 0;
        }

        :global(.chat) {
            height: 100% !important;
            padding: 0.2rem 0.4rem;
            box-sizing: border-box;
            position: relative !important;
            background-color: var(--chat-background);
        }

        #top {
            border-bottom: #242424 1px solid;
            display: flex;
            flex-direction: column;
            margin: 0;

            padding: 1rem;
            box-sizing: border-box;
        }

        #bottom {
            display: flex;
            flex-direction: column;

            border-top: #242424 1px solid;

            bottom: 0;

            span,
            section {
                padding: 0.7rem 1rem;
                box-sizing: border-box;
            }

            section {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                width: 100%;

                small {
                    display: inline-flex;
                    gap: 0.25rem;
                }

                .display {
                    display: inline-flex;
                    gap: 0.25rem;
                    width: 100%;
                }
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 0.7rem;
                box-sizing: border-box;

                #buttons {
                    display: inherit;
                    align-items: inherit;
                }
            }
        }
    }

    @media (max-width: 768px) {
        #chat-preview {
            max-width: unset;
            min-width: unset;

            overflow-y: auto;

            font-size: 0.4rem;

            height: 100%;
            width: 100dvw;
        }

        #top,
        #bottom {
            font-size: 0.7rem;
        }

        #chat-preview #bottom section {
            padding: 0.1rem 0.5rem;
        }
    }
</style>
