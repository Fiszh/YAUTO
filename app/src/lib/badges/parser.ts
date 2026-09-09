import { get } from "svelte/store";

import { getBadge } from "$lib/services/7TV/cosmetics";

import { badges } from "$stores/global";

import { settings, type SelectorSetting } from "$stores/settings";
import { flags } from "$lib/bitmap";
import { isPogly } from "$lib/pogly";

let BadgesData = get(badges);
badges.subscribe((e) => (BadgesData = e));

let onlyTwitchBadges = false;

let enabledBadges: string[] = [];

settings.subscribe((cfg) => {
    const foundSetting0 = cfg.find((setting) => setting.param == "badges");

    if (foundSetting0 && foundSetting0["type"] == "selector") {
        enabledBadges = (
            flags.getEnabled(
                foundSetting0["value"],
                foundSetting0["selectors"],
            ) as SelectorSetting["selectors"]
        )
            .map((item) => item["label"]?.toLowerCase())
            .filter((i) => typeof i == "string");
    }

    const foundSetting1 = cfg.find(
        (setting) => setting.param == "badgesTTV",
    ) || {
        value: false,
    };

    if (typeof foundSetting1.value == "boolean")
        onlyTwitchBadges = foundSetting1.value;
});

interface TwitchUserstate {
    "user-id-raw": string;
    "source-room-id": string;
    "badges-raw"?: string;
    "user-id": string;
    username: string;
}

interface KickUserstate extends TwitchUserstate {
    "badges-raw": never;
    badges: {
        type: string;
        text: string;
        sort_order: number;
        count?: number;
    }[];
    badges_v2: {
        name: string;
        badge_type: string;
        image_url: string;
        metadata: { level: number };
        selected: boolean;
        sort_order: number;
    }[];
}

interface YouTubeScales {
    url: string;
    width: number;
    height: number;
}

interface YouTubeUserstate extends TwitchUserstate {
    "badges-raw": never;
    id: string;
    name: string;
    thumbnails: YouTubeScales[];
    badges: {
        type: string;
        icon_type: string;
        tooltip: string;
        custom_thumbnail: YouTubeScales[];
    }[];
    is_moderator: boolean;
    is_verified: boolean;
    is_verified_artist: boolean;
}

type SharedUserState = TwitchUserstate | KickUserstate | YouTubeUserstate;

function getSharedChatAvatarBadge(
    userstate: TwitchUserstate,
): parsedBadge | null {
    const foundAvatarBadge =
        BadgesData["channel"]?.[userstate["source-room-id"]];

    if (!foundAvatarBadge) return null;

    return {
        badge_url: foundAvatarBadge,
        alt: "Shared Chat",
        background_color: undefined,
    };
}

function getUChatBadges(
    userstate: SharedUserState,
    platform: Platforms,
): parsedBadge[] {
    if (!enabledBadges.includes("uchat")) return [];

    return BadgesData["UChat"]
        .filter((badge) =>
            (Array.isArray(badge["users"])
                ? badge["users"]
                : (badge["users"][
                      platform.toLowerCase() as Lowercase<Platforms>
                  ] ?? [])
            ).includes(userstate["user-id-raw"]),
        )
        .map((foundUChatBadge) => ({
            badge_url: foundUChatBadge.urls["4x"],
            alt: foundUChatBadge.id,
            background_color: undefined,
        }));
}

function getTwitchBadges(userstate: TwitchUserstate): parsedBadge[] {
    if (
        !enabledBadges.includes("twitch") ||
        !userstate["badges-raw"] ||
        !Object.keys(userstate["badges-raw"]).length
    ) {
        return [];
    }

    const user_badges: parsedBadge[] = [];
    const rawBadges = userstate["badges-raw"];
    const badgesSplit = rawBadges.split(",");

    for (const Badge of badgesSplit) {
        const badgeSplit = Badge.split("/");

        if (BadgesData["TTV"].channel) {
            const badge = BadgesData["TTV"].channel.find(
                (badge) => badge.id === `${badgeSplit[0]}_${badgeSplit[1]}`,
            );

            if (badge) {
                user_badges.push({
                    badge_url: badge.url,
                    alt: badge.title,
                    background_color: undefined,
                });

                continue;
            }
        }

        // SEARCH IN GLOBAL IF NO CHANNEL BADGE FOUND
        const badge = BadgesData["TTV"].global.find(
            (badge) => badge.id === `${badgeSplit[0]}_${badgeSplit[1]}`,
        );

        if (badge && badge.id) {
            if (
                badge.id === "moderator_1" &&
                BadgesData["FFZ"]["user"]["mod"]
            ) {
                user_badges.push({
                    badge_url: BadgesData["FFZ"]["user"]["mod"],
                    alt: "Moderator",
                    background_color: "#00ad03",
                });

                continue;
            }

            if (badge.id === "vip_1" && BadgesData["FFZ"]["user"]["vip"]) {
                user_badges.push({
                    badge_url: BadgesData["FFZ"]["user"]["vip"],
                    alt: "VIP",
                    background_color: "#e005b9",
                });

                continue;
            }
        }

        if (badge)
            user_badges.push({
                badge_url: badge.url,
                alt: badge.title,
                background_color: undefined,
            });
    }

    return user_badges;
}

function getChatterinoBadges(userstate: TwitchUserstate): parsedBadge[] {
    const foundChatterinoBadges = [
        ...(enabledBadges.includes("chatterino")
            ? BadgesData["OTHER"]["Chatterino"]
            : []),
        ...(enabledBadges.includes("homies")
            ? [
                  ...BadgesData["OTHER"]["ChatterinoHomies"],
                  ...BadgesData["OTHER"]["ChatterinoHomiesCustom"],
              ]
            : []),
    ].filter((badge) => {
        return (
            ("userId" in badge &&
                badge["userId"] == userstate["user-id-raw"]) ||
            ("users" in badge && badge.users.includes(userstate["user-id-raw"]))
        );
    });

    return foundChatterinoBadges.map((foundChatterinoBadge) => ({
        badge_url:
            foundChatterinoBadge.image3 ||
            foundChatterinoBadge.image2 ||
            foundChatterinoBadge.image1,
        alt: foundChatterinoBadge.tooltip,
        background_color: undefined,
    }));
}

function getFFZBadges(userstate: TwitchUserstate): parsedBadge[] {
    if (!enabledBadges.includes("ffz")) return [];

    const foundFFZBadges = BadgesData["FFZ"]["global"].filter(
        (badge) =>
            badge.owners.includes(userstate["username"]) ||
            badge.id == BadgesData["FFZ"]["user"]["user"][userstate["user-id"]],
    );

    return foundFFZBadges.map((foundFFZBadge) => ({
        badge_url: foundFFZBadge.urls[foundFFZBadge.urls.length - 1].url,
        alt: foundFFZBadge.title,
        background_color: foundFFZBadge.color,
    }));
}

function getBTTVBadge(userstate: TwitchUserstate): parsedBadge | null {
    if (!enabledBadges.includes("bttv")) return null;

    const foundBTTVBadge = BadgesData["BTTV"]["global"].find((badge) =>
        badge.owners.includes(userstate?.["user-id-raw"]),
    );

    if (!foundBTTVBadge) return null;

    return {
        badge_url: foundBTTVBadge.url,
        alt: foundBTTVBadge.title,
        background_color: undefined,
    };
}

function getTurtegBotBadge(userstate: TwitchUserstate): parsedBadge | null {
    if (!enabledBadges.includes("turteg")) return null;

    const foundTurtegBotBadge = BadgesData["OTHER"]["TurtegBot"].find((badge) =>
        badge.users?.includes(userstate["user-id-raw"]),
    );

    if (!foundTurtegBotBadge) return null;

    return {
        badge_url: foundTurtegBotBadge.image,
        alt: foundTurtegBotBadge.title,
        background_color: undefined,
    };
}

function get7TVBadge(
    userstate: SharedUserState,
    platform: Platforms,
): parsedBadge | null {
    if (!enabledBadges.includes("7tv")) return null;

    const found7TVBadge = getBadge(platform, userstate["user-id-raw"]);

    if (!found7TVBadge) return null;

    return {
        badge_url: found7TVBadge.urls[found7TVBadge.urls.length - 1].url,
        alt: found7TVBadge.name,
        background_color: undefined,
    };
}

function getPolandBOTBadge(userstate: TwitchUserstate): parsedBadge | null {
    if (!enabledBadges.includes("polandbot")) return null;

    const foundPolandBOTBadge = Object.entries(
        BadgesData["OTHER"]["PolandBOT"],
    ).find(([_, userList]) => userList.includes(userstate["user-id-raw"]));

    if (!foundPolandBOTBadge) return null;

    const [role] = foundPolandBOTBadge;

    return {
        badge_url: `https://devpoland.xyz/badges/${role}.avif`,
        alt: role,
        background_color: undefined,
    };
}

const toCamelCase = (str: string): string =>
    str.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());

function getKickBadges(userstate: KickUserstate): parsedBadge[] | never[] {
    if (!enabledBadges.includes("kick")) return [];

    const badges_v1 = userstate["badges"].map((badge) => {
        if (badge["type"] == "subscriber" && BadgesData["KICK"].length) {
            const foundSubBadge = [...BadgesData["KICK"]]
                .reverse()
                .find((b) => b.months <= (badge["count"] ?? -1));

            if (foundSubBadge)
                return {
                    badge_url: foundSubBadge["url"],
                    alt: foundSubBadge["alt"],
                    background_color: undefined,
                    sort_order: badge["sort_order"],
                };
        }

        return {
            badge_url: `https://kickdatabase.com/kickBadges/${toCamelCase(badge["type"])}.svg`,
            alt: badge["text"],
            background_color: undefined,
            sort_order: badge["sort_order"],
        };
    });

    const badges_v2 = userstate["badges_v2"]
        .filter((badge) => badge["selected"])
        .map((badge) => ({
            badge_url: badge["image_url"],
            alt: badge["name"],
            background_color: undefined,
            sort_order: badge["sort_order"],
        }));

    const sorted = [...badges_v1, ...badges_v2].sort(
        (a, b) => a.sort_order - b.sort_order,
    );

    return sorted;
}

function getYouTubeBadges(
    userstate: YouTubeUserstate,
): parsedBadge[] | never[] {
    if (!enabledBadges.includes("youtube")) return [];

    return userstate["badges"].map((badge) => {
        if (badge["custom_thumbnail"].length)
            return {
                badge_url: badge["custom_thumbnail"][0]["url"],
                alt: badge["tooltip"],
                background_color: undefined,
            };

        return {
            badge_url: "/badges/youtube/" + badge["icon_type"] + ".svg",
            alt: badge["tooltip"],
            background_color: undefined,
        };
    });
}

function getBadgesForTwitch(userstate: TwitchUserstate): parsedBadge[] {
    const user_badges: parsedBadge[] = [];

    const avatarBadge = getSharedChatAvatarBadge(userstate);
    if (avatarBadge) user_badges.push(avatarBadge);

    user_badges.push(...getUChatBadges(userstate, "TWITCH"));

    // THIS NEEDS TO BE ALWAYS ON THE START TO MAKE SURE TWITCH BADGES WILL BE FIRST
    user_badges.push(...getTwitchBadges(userstate));

    if (onlyTwitchBadges) return user_badges;

    user_badges.push(...getChatterinoBadges(userstate));
    user_badges.push(...getFFZBadges(userstate));

    const bttvBadge = getBTTVBadge(userstate);
    if (bttvBadge) user_badges.push(bttvBadge);

    const turtegBadge = getTurtegBotBadge(userstate);
    if (turtegBadge) user_badges.push(turtegBadge);

    const sevenTVBadge = get7TVBadge(userstate, "TWITCH");
    if (sevenTVBadge) user_badges.push(sevenTVBadge);

    const polandBotBadge = getPolandBOTBadge(userstate);
    if (polandBotBadge) user_badges.push(polandBotBadge);

    return user_badges;
}

function getBadgesForKick(userstate: KickUserstate): parsedBadge[] {
    const user_badges: parsedBadge[] = [];

    user_badges.push(...getUChatBadges(userstate, "KICK"));

    // THIS NEEDS TO BE ALWAYS ON THE START TO MAKE SURE KICK BADGES WILL BE FIRST
    user_badges.push(...getKickBadges(userstate));

    const sevenTVBadge = get7TVBadge(userstate, "KICK");
    if (sevenTVBadge) user_badges.push(sevenTVBadge);

    return user_badges;
}

function getBadgesForYouTube(userstate: YouTubeUserstate): parsedBadge[] {
    const user_badges: parsedBadge[] = [];

    user_badges.push(...getUChatBadges(userstate, "GOOGLE"));

    // THIS NEEDS TO BE ALWAYS ON THE START TO MAKE SURE YOUTUBE BADGES WILL BE FIRST
    user_badges.push(...getYouTubeBadges(userstate));

    const sevenTVBadge = get7TVBadge(userstate, "GOOGLE");
    if (sevenTVBadge) user_badges.push(sevenTVBadge);

    return user_badges;
}

export function parseBadges(
    userstate: SharedUserState,
    platform: Platforms,
): parsedBadge[] {
    if (platform == "KICK") {
        return getBadgesForKick(userstate as KickUserstate);
    } else if (platform == "GOOGLE") {
        return getBadgesForYouTube(userstate as YouTubeUserstate);
    } else {
        return getBadgesForTwitch(userstate as TwitchUserstate);
    }
}
