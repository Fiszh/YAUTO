import { get } from "svelte/store";

import twemoji from "@twemoji/api";

import { getPersonalSets } from "$lib/services/7TV/cosmetics";

import { emotes, globals } from "$stores/global";
import { chatSettings, setEmoteSize } from "$stores/settings";
import { getSavedSet } from "$lib/overlayIndex";
import type { YTNodes } from "youtubei.js";

const kickEmoteRegex = /\[emote:(?<id>\d+)[:]?(?<name>[a-zA-Z0-9-_!]*)[:]?\]/g; // https://github.com/KickTalkOrg/KickTalk/blob/a3570be165618f70449257bbb70df7cd16b66efe/utils/constants.js#L3

let emoteSize = Number(get(setEmoteSize));
setEmoteSize.subscribe((value) => (emoteSize = Number(value)));

type TwemojiToken = string | { emoji: string; image: string };

function splitTextWithTwemoji(text: string): TwemojiToken[] {
    const parsedText = twemoji.parse(text, {
        base: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/",
        folder: "svg",
        ext: ".svg",
    });

    const div = document.createElement("div");
    div.innerHTML = parsedText;

    const result: TwemojiToken[] = [];
    const nodes = div.childNodes;

    for (const node of nodes) {
        if (node.nodeType === 1) {
            // ELEMENT_NODE
            const el = node as HTMLImageElement;
            if (el.nodeName === "IMG" && el.src) {
                result.push({ emoji: el.alt, image: el.src });
                continue;
            }
        }

        if (node.textContent) {
            // TEXT_NODE
            if (globals["channels"]["KICK"]["Name"]) {
                result.push(...splitKickEmotes(node.textContent));
            } else {
                result.push(
                    ...node.textContent
                        .split(" ")
                        .filter((w) => w.trim() !== ""),
                );
            }
        }
    }

    return result.filter(Boolean);
}

const sanitizeInput = (input: string) =>
    typeof input !== "string"
        ? input
        : input
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
              .replace(/\//g, "&#x2F;");

function findEntryAndTier(prefix: string, bits: number) {
    prefix = prefix.toLowerCase();

    const emote_data = get(emotes);

    for (const entry of emote_data["BITS"]) {
        if (entry.name.toLowerCase() !== prefix) continue;

        for (let i = 0; i < entry.tiers.length; i++) {
            const currentTier = entry.tiers[i];
            const nextTier = entry.tiers[i + 1];

            if (!nextTier && bits >= currentTier.min_bits)
                return { name: entry.name, tier: currentTier };

            if (bits >= currentTier.min_bits && bits < nextTier.min_bits)
                return { name: entry.name, tier: currentTier };
        }
    }

    return null;
}

function parseTwitchEmotes(
    message: string,
    userstate: Record<string, any>,
): EmoteParser.TwitchEmoteInfo[] {
    if (userstate.emotes) {
        const entries = Object.entries(userstate.emotes) as [
            string,
            string | string[],
        ][];

        return entries.flatMap(([emoteId, raw]) => {
            const positions = Array.isArray(raw) ? raw : [raw];

            return positions.map((position) => {
                const [start, end] = position.split("-").map(Number);
                const name = Array.from(message)
                    .slice(start, end + 1)
                    .join("");

                return {
                    name,
                    emote_id: emoteId,
                    url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
                    site: "TTV",
                };
            });
        });
    } else {
        return [];
    }
}

function splitKickEmotes(part: string): string[] {
    const tokens = [];
    let lastIndex = 0;

    for (const match of part.matchAll(kickEmoteRegex)) {
        if (match.index > lastIndex)
            tokens.push(part.slice(lastIndex, match.index));

        tokens.push(match[0]);
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < part.length)
        tokens.push(
            ...part
                .slice(lastIndex)
                .split(" ")
                .filter((w) => w.trim() !== ""),
        );

    return tokens;
}

const parseKickEmotes = (part: string): EmoteParser.KickEmoteInfo[] =>
    [...part.matchAll(kickEmoteRegex)]
        .filter((match) => match.groups)
        .map((match) => ({
            emote_id: match.groups!.id,
            name: `[emote:${match.groups!.id}:${match.groups!.name}]`,
            url: `https://files.kick.com/emotes/${match.groups!.id}/fullsize`,
            site: "KICK",
        }));

function parseYouTubeEmotes(
    runs: InstanceType<typeof YTNodes.LiveChatTextMessage>["message"]["runs"],
): EmoteParser.YouTubeEmoteInfo[] {
    if (runs?.length) {
        return Object.values(
            runs.reduce<Record<string, EmoteParser.YouTubeEmoteInfo>>(
                (acc, run) => {
                    if ("emoji" in run && !acc[run["text"]]) {
                        acc[run["text"]] = {
                            name: run["text"],
                            emote_id: run["emoji"]["emoji_id"],
                            url: run["emoji"]["image"][0]["url"],
                            site: "YT",
                        };
                    }
                    return acc;
                },
                {},
            ),
        );
    } else {
        return [];
    }
}

export async function replaceWithEmotes(
    inputString: string,
    userstate: Record<string, any>,
    originChannelID: string | number,
    platform?: Platforms,
): Promise<EmoteParser.FoundPart[] | string> {
    if (!inputString) return inputString;

    inputString = sanitizeInput(inputString);

    const emote_data = get(emotes);

    try {
        const globalEmotesData = [
            ...emote_data["7TV"].global,
            ...emote_data["BTTV"].global,
            ...emote_data["FFZ"].global,
        ];

        const STV_set = getSavedSet(
            String(originChannelID),
            platform ?? "TWITCH",
        );

        let nonGlobalEmoteData = [
            ...(emote_data["BTTV"].channel?.[originChannelID] || []),
            ...(emote_data["FFZ"].channel?.[originChannelID] || []),
            ...(STV_set ? STV_set["set"]["emotes"] : []),
        ];

        const foundPersonalSets = getPersonalSets(
            platform ?? "TWITCH",
            userstate["user-id-raw"],
        );

        const TTVMessageEmoteData = parseTwitchEmotes(inputString, userstate);
        const YTMessageEmoteData =
            "message" in userstate
                ? parseYouTubeEmotes(userstate["message"]["runs"])
                : [];
        const KICKMessageEmoteData = parseKickEmotes(inputString);

        const emoteData: EmoteParser.FoundEmote["emote"][] = [
            ...TTVMessageEmoteData,
            ...KICKMessageEmoteData,
            ...YTMessageEmoteData,
            ...(foundPersonalSets
                ? foundPersonalSets.flatMap((set) => set.emotes || [])
                : []),
            ...nonGlobalEmoteData,
            ...globalEmotesData,
        ];

        //if (!emoteData.length) { return inputString; }; MIGHT NOT BE USEFULL ANYMORE DUE TO TWEMOJIS NOT WORKING IF NO EMOTES

        const EmoteSplit = await splitTextWithTwemoji(inputString);

        const foundParts: EmoteParser.FoundPart[] = [];

        for (const part of EmoteSplit) {
            let foundPart: EmoteParser.FoundPart | undefined;

            // Detect emoji
            if (typeof part == "object" && "emoji" in part) {
                foundPart = {
                    type: "emoji",
                    emoji: {
                        name: part.emoji,
                        url: part.image,
                    },
                };
            }

            // Detect bits
            if (
                !foundPart &&
                userstate &&
                userstate["bits"] &&
                typeof part == "string"
            ) {
                const match = part.match(/^([a-zA-Z]+)(\d+)$/);

                if (match) {
                    const prefix = match[1]; // Prefix
                    const bits = Number(match[2]); // Amount

                    const result = findEntryAndTier(prefix, bits);

                    if (result) {
                        foundPart = {
                            type: "bits",
                            bits: {
                                name: result.name,
                                url: result.tier.url,
                                color: result.tier.color,
                                bits,
                            },
                        };
                    }
                }
            }

            // Other emotes
            if (!foundPart) {
                const matchingEmote = emoteData.find(
                    (emote) => emote.name && part === emote.name,
                );

                if (matchingEmote) {
                    foundPart = {
                        type: "emote",
                        emote: matchingEmote,
                    };
                }
            }

            // Search for user if no emote is found
            const username =
                typeof part == "string"
                    ? part.replace(/[@,]/g, "").toLowerCase()
                    : "";
            const mentionColor = chatSettings["mentionColor"];

            // check if mention color is enabled
            if (
                !foundPart &&
                mentionColor &&
                globals.userNameColor[username] &&
                typeof part == "string"
            ) {
                foundPart = {
                    type: "user",
                    input: part,
                    name: username,
                    nameColor: globals.userNameColor[username],
                };
            }

            const last = foundParts.at(-1);
            if (foundPart) {
                if (
                    foundPart["type"] == "emoji" ||
                    foundPart["type"] == "emote"
                ) {
                    const lastIsEmojiOrEmote =
                        !!last && ["emote", "emoji"].includes(last["type"]);
                    const foundEmote =
                        "emote" in foundPart ? foundPart["emote"] : undefined;
                    const isServiceEmote =
                        !!foundEmote &&
                        "site" in foundEmote &&
                        ["TTV", "KICK", "YT"].includes(foundEmote["site"]);
                    const hasNonStandardFlags =
                        !!foundEmote &&
                        "flags" in foundEmote &&
                        foundEmote["flags"] != 256;

                    if (
                        !lastIsEmojiOrEmote ||
                        isServiceEmote ||
                        hasNonStandardFlags ||
                        "emoji" in foundPart
                    ) {
                        foundParts.push({
                            ...foundPart,
                            overlapped: [],
                        });
                    } else if (
                        lastIsEmojiOrEmote &&
                        foundEmote &&
                        "flags" in foundEmote
                    ) {
                        const overlappedArray =
                            "overlapped" in last ? last["overlapped"] : [];
                        const lastOverlapped = overlappedArray?.at(-1);
                        const lastEmoteId =
                            last.type == "emote"
                                ? last["emote"]["emote_id"]
                                : undefined;
                        const previousEmoteId =
                            lastOverlapped?.["emote_id"] ?? lastEmoteId;

                        const isDifferentEmote =
                            previousEmoteId != foundEmote["emote_id"] ||
                            last.type == "emoji";

                        if (
                            overlappedArray &&
                            isDifferentEmote &&
                            foundEmote["flags"] == 256
                        ) {
                            overlappedArray.push({
                                ...foundEmote,
                                overlap_index: overlappedArray.length,
                            });
                        }
                    }
                } else {
                    foundParts.push(foundPart);
                }
            } else {
                if (last && last["type"] == "other") {
                    last["part"] += " " + part;
                } else {
                    foundParts.push({
                        type: "other",
                        part: part as string,
                    });
                }
            }
        }

        return foundParts;
    } catch (error) {
        console.error("Error replacing words with images:", error);
        return inputString;
    }
}
