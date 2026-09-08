<script lang="ts">
    import { onMount } from "svelte";

    import { replaceWithEmotes } from "$lib/emotes/parser";
    import { parseBadges } from "$lib/badges/parser";
    import { fixNameColor } from "$lib/overlayIndex";

    import Badge from "$components/Badge.svelte";

    import { chatSettings, settings } from "$stores/settings";
    import { emotes, globals } from "$stores/global";
    import { cosmetics } from "$stores/cosmetics";
    import Twitch from "$components/logos/twitch.svelte";
    import Kick from "$components/logos/kick.svelte";
    import YouTube from "$components/logos/youtube.svelte";
    import Paint from "./paint.svelte";
    import Emote from "./emote.svelte";
    import { removeMessage } from "$lib/message";
    import Gif from "./gif.svelte";

    interface Userstate {
        id: string;
        color?: string;
        action?: boolean;
    }

    type Props = {
        user: string;
        text: string;
        tags: Parameters<typeof parseBadges>[0] & Userstate;
        message_id: string;
        room_id: number;
        platform: Platforms;
        removed?: boolean;
    };

    let { user, text, tags, message_id, room_id, platform, removed }: Props =
        $props();

    let username = $state<Lowercase<string>>("");
    let nameColor = $state<string>("");

    let parsedBadges = $derived<parsedBadge[]>(
        $cosmetics && parseBadges(tags, platform),
    );

    let chatMessage: HTMLElement;

    onMount(() => {
        if (Number(chatSettings["fadeOut"]) && window.location.search) {
            const delay = Number(chatSettings["fadeOut"]) * 1000;

            setTimeout(() => {
                if (!chatMessage) return;
                chatMessage.classList.add("fadeOut");
                setTimeout(() => removeMessage(message_id), 2600);
            }, delay);
        }

        username =
            (tags.username.toLowerCase().trim() as Lowercase<string>) ?? "";
        nameColor = tags.color
            ? fixNameColor(tags.color)
            : usernameColor(username);

        globals.userNameColor[username] = nameColor;
    });

    let parsedMessage = $state<Awaited<ReturnType<typeof replaceWithEmotes>>>();
    const parse = async () =>
        (parsedMessage = await replaceWithEmotes(
            text,
            tags,
            room_id,
            platform,
        ));

    parse();

    if (!window.location.search) {
        emotes.subscribe(() => parse());
        settings.subscribe(() => parse());
    }

    function usernameColor(name: string) {
        const colors = [
            "#0000FF", // Blue
            "#8A2BE2", // Blue Violet
            "#5F9EA0", // Cadet Blue
            "#D2691E", // Chocolate
            "#FF7F50", // Coral
            "#1E90FF", // Dodger Blue
            "#B22222", // Firebrick
            "#DAA520", // Golden Rod
            "#008000", // Green
            "#FF69B4", // Hot Pink
            "#FF4500", // Orange Red
            "#FF0000", // Red
            "#2E8B57", // Sea Green
            "#00FF7F", // Spring Green
            "#9ACD32", // Yellow Green
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++)
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    const moreThanOneService =
        Object.values(globals["channels"]).filter((s) =>
            Object.values(s).find((c) => c != null),
        ).length > 1;
</script>

{#snippet Badges()}
    <strong class="badge-wrapper">
        {#if moreThanOneService}
            {#if platform == "TWITCH"}
                <Twitch brandColor />
            {:else if platform == "KICK"}
                <Kick brandColor />
            {:else if platform == "GOOGLE"}
                <YouTube brandColor />
            {/if}
        {/if}
        {#each parsedBadges as badge, i (i)}
            <Badge
                badge_url={badge.badge_url}
                alt={badge.alt}
                background_color={badge.background_color ?? ""}
            />
        {/each}
    </strong>
{/snippet}

<div class="chat-message" bind:this={chatMessage} class:removed>
    {#if (parsedBadges && parsedBadges.length) || moreThanOneService}{@render Badges()}{/if}
    <Paint
        {platform}
        platformID={tags["user-id-raw"]}
        backgroundColor={nameColor ?? ""}
    >
        {@html user}
    </Paint>{#if !tags.action}:{/if}
    <span
        style:color={tags.action ? nameColor : "defaultColor"}
        data-first-type={Array.isArray(parsedMessage)
            ? parsedMessage[0]["type"]
            : undefined}
    >
        {#if typeof (parsedMessage ?? text) == "string"}
            <span class="text-part">{@html parsedMessage ?? text}</span>
        {:else if Array.isArray(parsedMessage)}
            {#if "gifs" in tags && chatSettings["gifs"]}
                <Gif url={tags["gifs"] as string} />
            {:else}
                {#each parsedMessage as part}
                    {#if part["type"] == "emote" || part["type"] == "bits" || part["type"] == "emoji"}
                        <Emote emoteInfo={part} />
                    {:else if part["type"] == "user"}
                        <Paint
                            {platform}
                            platformID={part["name"]}
                            backgroundColor={part["nameColor"]}
                        >
                            {@html part["input"]}
                        </Paint>
                    {:else if part["type"] == "other"}
                        {@html part["part"]}
                    {:else}
                        <p id="unkown">UNKNOWN TYPE: {part["type"]}</p>
                    {/if}
                {/each}
            {/if}
        {/if}
    </span>
</div>

{#if __DEBUG__}
    <style lang="scss">
        .chat-message {
            & > span[data-first-type="other"] {
                outline: red solid 1px;
            }

            & > span:not([data-first-type="other"]) {
                outline: blue solid 1px;
            }
        }
    </style>
{/if}

<style lang="scss">
    .chat-message {
        display: block;
        padding: 0.15rem 0rem;

        &.removed {
            opacity: 0;
        }

        .badge-wrapper {
            display: inline-flex;
            line-height: normal;
            vertical-align: middle;
            gap: 0.25rem;
        }

        span {
            display: inline;
            vertical-align: baseline;
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-word;

            & > :global(*) {
                margin-inline: 0.25rem;
            }

            &:not([data-first-type="other"]) > :global(*:first-child) {
                margin-left: 0;
            }
        }

        #unkown {
            margin: 0;
            display: contents;
            color: red;
        }
    }
</style>
