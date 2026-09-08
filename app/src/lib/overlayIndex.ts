import { get } from "svelte/store";

import tinycolor from "tinycolor2";

import { cosmetics } from "$stores/cosmetics";
import {
    API_URL,
    badges,
    emotes,
    globals,
    type GlobalEmotes,
} from "$stores/global";

import { services } from "$lib/services";
import { settings, type Setting } from "$stores/settings";

let cosmetic_data = get(cosmetics);
let emote_data = get(emotes);

// SUBSCRIBE TO CHANGES
cosmetics.subscribe((data) => (cosmetic_data = data));
emotes.subscribe((data) => (emote_data = data));

export function generateUUID(): string {
    let UUID: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";

    try {
        UUID = window.crypto.randomUUID();
    } catch {
        // fallback
        UUID = UUID.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    } finally {
        return UUID;
    }
}

// ANCHOR FUNCTIONS
export const fixNameColor = (name_color: string): string =>
    tinycolor(name_color).getBrightness() <= 50
        ? tinycolor(name_color).lighten(30).toString()
        : name_color;

export async function getMainUser(channel: string | number) {
    try {
        const response = await fetch(
            API_URL +
                `/channel?${typeof channel == "string" ? `name=` : `id=`}${channel}`,
            {
                headers: {
                    version: __APP_VERSION,
                },
            },
        );

        if (!response.ok) {
            console.error("Fetch error:", response.status, response.statusText);
            return false;
        }

        const response_data: UChat.ChannelResponse = await response.json();

        if (
            "error" in response_data ||
            Object.keys(response_data.channel.data).length < 5
        ) {
            console.error(
                "Invalid or incomplete data structure:",
                response_data,
            );
            return false;
        }

        const channel_data = response_data.channel.data;

        const data = {
            channel_info: channel_data["channel_info"],
            channel_badges: channel_data["channel_badges"],
            channel_bits: channel_data["channel_cheer_emotes"],
            global_badges: channel_data["global_badges"],
            global_bits: channel_data["global_cheer_emotes"],
        };

        // CHANNEL INFO LOGIN
        globals["channels"]["TWITCH"]["ID"] = data.channel_info.id ?? null;
        globals["channels"]["TWITCH"]["Name"] = data.channel_info.login ?? null;
        const channel_color = data.channel_info.chatColor ?? "white";

        // CHANNEL BADGES
        const broadcastBadges = data.channel_badges.broadcastBadges ?? [];
        try {
            badges.update((badgeData) => {
                badgeData["TTV"].channel = broadcastBadges.map((badge) => ({
                    id: badge.setID + "_" + badge.version,
                    url:
                        badge.image4x ||
                        badge.image3x ||
                        badge.image2x ||
                        badge.image1x,
                    title: badge.title,
                }));

                return badgeData;
            });
        } catch (err) {
            console.error("Error loading channel badges:", err);
        }

        // CHANNEL BITS EMOTES
        let channel_bit_emotes: Emotes.Bits[] = [];
        try {
            const cheerGroups = data.channel_bits.cheer?.cheerGroups ?? [];
            channel_bit_emotes = cheerGroups.map<Emotes.Bits>((group) => {
                const node = group.nodes[0];
                const prefix = (node.prefix ?? "prefix").toLowerCase();
                const templateURL =
                    group.templateURL ||
                    "https://d3aqoihi2n8ty8.cloudfront.net/actions/PREFIX/BACKGROUND/ANIMATION/TIER/SCALE.EXTENSION";

                return {
                    name: prefix,
                    tiers:
                        node.tiers.map((tier) => {
                            const replacements = {
                                PREFIX: prefix,
                                BACKGROUND: "dark",
                                ANIMATION: "animated",
                                TIER: tier.bits ?? "TIER",
                                "SCALE.EXTENSION": "4.gif",
                            };

                            const tierURL = templateURL.replace(
                                /PREFIX|BACKGROUND|ANIMATION|TIER|SCALE\.EXTENSION/g,
                                (match) =>
                                    String(
                                        replacements[
                                            match as keyof typeof replacements
                                        ],
                                    ),
                            );

                            return {
                                min_bits: tier.bits,
                                url: "tierURL",
                                emote_link: tierURL,
                                color: channel_color,
                            };
                        }) || [],
                    site: "TTV",
                };
            });
        } catch (err) {
            console.error("Error loading channel bit emotes:", err);
        }

        // GLOBAL BITS EMOTES
        let global_bit_emotes: Emotes.Bits[] = [];
        try {
            const global_groups = data.global_bits.groups;
            const displayConfig = data.global_bits.displayConfig.colors;

            global_bit_emotes =
                global_groups[0].nodes.map((group) => {
                    const prefix = (group.prefix ?? "prefix").toLowerCase();
                    const templateURL =
                        global_groups[0].templateURL ||
                        "https://d3aqoihi2n8ty8.cloudfront.net/actions/PREFIX/BACKGROUND/ANIMATION/TIER/SCALE.EXTENSION";

                    return {
                        name: prefix,
                        tiers:
                            group.tiers.map((tier) => {
                                const replacements = {
                                    PREFIX: prefix,
                                    BACKGROUND: "dark",
                                    ANIMATION: "animated",
                                    TIER: tier.bits || "TIER",
                                    "SCALE.EXTENSION": "4.gif",
                                };

                                const tierURL = templateURL.replace(
                                    /PREFIX|BACKGROUND|ANIMATION|TIER|SCALE\.EXTENSION/g,
                                    (match) =>
                                        String(
                                            replacements[
                                                match as keyof typeof replacements
                                            ],
                                        ),
                                );

                                return {
                                    min_bits: tier.bits,
                                    url: tierURL,
                                    emote_link: tierURL,
                                    color:
                                        displayConfig.find(
                                            (color) => color.bits === tier.bits,
                                        )?.color ?? "white",
                                };
                            }) || [],
                        site: "TTV",
                    };
                }) || [];
        } catch (err) {
            console.error("Error loading global bit emotes:", err);
        }

        // GLOBAL BADGES
        try {
            badges.update((badgeData) => {
                badgeData["TTV"].global = data.global_badges.map((badge) => ({
                    id: badge.setID + "_" + badge.version,
                    url:
                        badge.image4x ||
                        badge.image3x ||
                        badge.image2x ||
                        badge.image1x,
                    title: badge.title,
                }));

                return badgeData;
            });
        } catch (err) {
            console.error("Error loading global badges:", err);
        }

        emotes.update((emoteData) => {
            emoteData["BITS"] = [...global_bit_emotes, ...channel_bit_emotes];

            return emoteData;
        });

        // SETTINGS
        if (response_data["user_settings"])
            parseSavedSettings(response_data["user_settings"]);

        return true;
    } catch (err) {
        return false;
    }
}

export function parseSavedSettings(
    saved_settings: NonNullable<UChat.Channel["user_settings"]>,
) {
    for (const [key, value] of Object.entries(saved_settings)) {
        settings.update((arr) => {
            const foundSetting = arr.find((setting) => setting.param == key);

            if (foundSetting) {
                if (!Array.isArray(value)) {
                    foundSetting.value = value as Setting["value"];
                } else {
                    foundSetting.value = value.join(" ") as Setting["value"];
                }
            }

            return arr;
        });
    }
}

export function getSavedSet(
    id: string,
    platform?: Platforms,
    emoteData: GlobalEmotes = emote_data,
): {
    set: SavedSevenTVSet;
    owner?: Types7TV.UserInfo["connections"][0] | never;
} | null {
    if (!platform) {
        const set = emoteData["7TV"].channel.find((s) => s["id"] == id);

        if (!set) return null;

        return { set };
    }

    const set = emoteData["7TV"].channel.find((s) =>
        s["owners"].find((o) => o["id"] == id && o["platform"] == platform),
    );

    if (!set) return null;

    const owner = set["owners"].find(
        (o) => o["id"] == id && o["platform"] == platform,
    );

    if (!owner) return null;

    return { set, owner };
}

export async function connectToWS() {
    services["7TV"].ws.connect();
    if (globals["channels"]["TWITCH"]["ID"]) services["BTTV"].ws.connect();
}

export async function subscribeEventAPIToSharedChatUser(room_id: string) {
    if (room_id == globals["channels"]["TWITCH"]["ID"]) return;

    // BTTV
    if (emote_data["BTTV"]["channel"][room_id])
        services["BTTV"].ws.subscribe(room_id, false, true);

    // 7TV
    services["7TV"].ws.subscribe(
        room_id,
        "entitlement.create",
        {
            platform: "TWITCH",
            ctx: "channel",
        },
        true,
    ); // PAINTS, BADGES & PERSONAL EMOTES

    const channel_set = getSavedSet(room_id, "TWITCH");
    if (channel_set) {
        if (channel_set["set"]["id"])
            services["7TV"].ws.subscribe(
                channel_set["set"]["id"],
                "emote_set.update",
                {},
                true,
            );

        if (channel_set["owner"] && channel_set["owner"]["user_id"])
            services["7TV"].ws.subscribe(
                channel_set["owner"]["user_id"],
                "user.*",
                {},
                true,
            );
    }
}

export async function unsubscribeEventAPISharedChatUser(room_id: string) {
    if (room_id == globals["channels"]["TWITCH"]["ID"]) return;

    // BTTV
    services["BTTV"].ws.unsubscribe(room_id);

    // 7TV
    services["7TV"].ws.unsubscribe(room_id, "entitlement.create");

    const channel_set = getSavedSet(room_id, "TWITCH");
    if (channel_set) {
        if (channel_set["set"]["id"])
            services["7TV"].ws.unsubscribe(
                channel_set["set"]["id"],
                "emote_set.update",
            );

        if (channel_set["owner"] && channel_set["owner"]["user_id"])
            services["7TV"].ws.unsubscribe(
                channel_set["owner"]["user_id"],
                "user.*",
            );
    }
}

export async function cleanUpSharedChat() {
    if (!globals.inSharedChat) return;

    const room_ids_keys = [
        ...Object.keys(emote_data["7TV"]["channel"]),
        ...Object.keys(emote_data["BTTV"]["channel"]),
    ];

    if (!room_ids_keys.length) return;

    const room_ids = room_ids_keys.reduce<string[]>((arr, key) => {
        if (!arr.includes(key)) arr.push(key);

        return arr;
    }, []);

    for (const room_id of room_ids) {
        if (room_id == globals["channels"]["TWITCH"]["ID"]) continue;

        await unsubscribeEventAPISharedChatUser(room_id);
    }

    if (globals["channels"]["TWITCH"]["ID"]) {
        emotes.update((emotesData) => {
            emotesData["7TV"]["channel"] = emotesData["7TV"]["channel"].filter(
                (s) =>
                    s["owners"].some(
                        (o) => o["id"] == globals["channels"]["TWITCH"]["ID"],
                    ),
            );

            emotesData["BTTV"]["channel"] = {
                [globals["channels"]["TWITCH"]["ID"] as string]:
                    emotesData["BTTV"]["channel"][
                        globals["channels"]["TWITCH"]["ID"] as string
                    ],
            };

            emotesData["FFZ"]["channel"] = {
                [globals["channels"]["TWITCH"]["ID"] as string]:
                    emotesData["FFZ"]["channel"][
                        globals["channels"]["TWITCH"]["ID"] as string
                    ],
            };

            return emotesData;
        });
    }

    globals.inSharedChat = false;
}

// ANCHOR 7TV WEBSOCKET
services["7TV"].ws.on("open", () => {
    if (globals["channels"]["TWITCH"]["ID"]) {
        services["7TV"].ws.subscribe(
            globals["channels"]["TWITCH"]["ID"],
            "entitlement.create",
            {
                platform: "TWITCH",
                ctx: "channel",
            },
        ); // 7TV account not needed to recieve cosmetic info
    }

    if (globals["channels"]["KICK"]["userID"]) {
        services["7TV"].ws.subscribe(
            globals["channels"]["KICK"]["userID"],
            "entitlement.create",
            {
                platform: "KICK",
                ctx: "channel",
            },
        ); // 7TV account not needed to recieve cosmetic info
    }

    const unique7TVIDs = [
        ...new Set(emote_data["7TV"]["channel"].map((s) => s["id"])),
    ];

    const unique7TVSetIDs = [
        ...new Set(
            emote_data["7TV"]["channel"].flatMap((s) =>
                s["owners"].map((c) => c["user_id"]),
            ),
        ),
    ];

    for (const id of unique7TVSetIDs)
        services["7TV"].ws.subscribe(id, "user.*"); // SET CHANGES

    for (const id of unique7TVIDs)
        services["7TV"].ws.subscribe(id, "emote_set.update"); // EMOTE CHANGES
});

services["7TV"].ws.on("add_emote", (id, actor, data) => {
    if (cosmetic_data.sets[id]) {
        // PERSONAL SETS
        cosmetics.update((cosmeticsData) => {
            cosmeticsData.sets[id].emotes = data;

            return cosmeticsData;
        });
    } else {
        // CHANNEL SET
        emotes.update((emoteData) => {
            const found_set = getSavedSet(id, undefined, emoteData);

            if (found_set && "set" in found_set)
                found_set["set"]["emotes"].push(...data);

            return emoteData;
        });
    }

    //console.log("Emote added:", id, data);
});

services["7TV"].ws.on("remove_emote", (id, actor, data) => {
    emotes.update((emoteData) => {
        const found_set = getSavedSet(id, undefined, emoteData);

        if (found_set && "set" in found_set)
            found_set["set"]["emotes"] = found_set["set"]["emotes"].filter(
                (emote) => emote.name !== data.name,
            );

        return emoteData;
    });

    //console.log("Emote removed:", id, data);
});

services["7TV"].ws.on("rename_emote", (id, actor, data) => {
    emotes.update((emoteData) => {
        const found_set = getSavedSet(id, undefined, emoteData);

        if (found_set && "ste" in found_set) {
            const foundEmote = found_set["set"]["emotes"].find(
                (emote) => emote.name === data.old.name,
            );

            if (foundEmote) foundEmote.name = data.new.name;
        }

        return emoteData;
    });

    //console.log("Emote renamed:", id, data);
});

services["7TV"].ws.on("set_change", async (actor, data) => {
    // no need to resub to a new set id, already done via the websocket client
    const newSet = await services["7TV"].main.emoteSet.bySetID(
        data["new_set"]["id"],
    );

    emotes.update((emoteData) => {
        const foundOldSet = getSavedSet(
            data["old_set"]["id"],
            undefined,
            emoteData,
        );
        const foundNewSet = getSavedSet(
            data["new_set"]["id"],
            undefined,
            emoteData,
        );

        const oldSetOwners = foundOldSet
            ? foundOldSet["set"]["owners"].filter(
                  (c) => c["user_id"] == data["SevenTV_user_id"],
              )
            : []; // for now we trust the overlay to have the set saved, gotta fix that later

        if (foundOldSet)
            foundOldSet["set"]["owners"] = foundOldSet["set"]["owners"].filter(
                (c) => c["user_id"] != data["SevenTV_user_id"],
            );

        if (foundNewSet) {
            foundNewSet["set"]["owners"] = [
                ...foundNewSet["set"]["owners"],
                ...oldSetOwners,
            ];
        } else {
            emoteData["7TV"]["channel"] = [
                ...emoteData["7TV"]["channel"],
                {
                    ...(foundOldSet || []),
                    id: data.new_set.id,
                    emotes: newSet,
                    owners: oldSetOwners,
                },
            ];
        }

        return emoteData;
    });

    //console.log("Emote set changed:", data);
});

services["7TV"].ws.on("create_badge", (data) => {
    if (!cosmetic_data.badges[data.id]) {
        cosmetics.update((cosmeticsData) => {
            cosmeticsData.badges[data.id] = data;

            return cosmeticsData;
        });
    }
});

services["7TV"].ws.on("create_paint", (data) => {
    if (!cosmetic_data.paints[data.id]) {
        cosmetics.update((cosmeticsData) => {
            cosmeticsData.paints[data.id] = data;

            return cosmeticsData;
        });
    }
});

services["7TV"].ws.on("create_personal_set", (data) => {
    // CREATE PERSONAL SET
    if (!cosmetic_data.sets[data.id]) {
        cosmetics.update((cosmeticsData) => {
            cosmeticsData.sets[data.id] = {
                id: data.id,
                name: data.name,
                flags: data.flags,
                owner: data?.flags == 4 ? data.owner : [],
                emotes: [],
            };

            return cosmeticsData;
        });
    }
});

// PERSONAL SETS SHOULD NOT REMOVE THE OWNER, RIGHT 7TV?
services["7TV"].ws.on("create_entitlement", (data) => {
    // BIND A BADGE, PAINT OR SET TO A USER
    const mappedIDs = data.owner.map((c) => c.id + "-" + c.platform);

    if (
        cosmetic_data.sets[data.id] &&
        cosmetic_data.sets[data.id]?.flags != 4
    ) {
        // SET
        cosmetics.update((cosmeticsData) => {
            // GIVE OWNERSHIP TO SET
            cosmeticsData.sets[data.id].owner = [
                ...cosmeticsData.sets[data.id].owner,
                ...data.owner,
            ];

            return cosmeticsData;
        });
    } else if (cosmetic_data.badges[data.id]) {
        // BADGE
        cosmetics.update((cosmeticsData) => {
            for (const badge of Object.values(cosmeticsData.badges)) {
                // REMOVE OLD BADGE OWNER
                badge.owner = badge.owner.filter(
                    (c) => !mappedIDs.includes(c.id + "-" + c.platform),
                );
            }

            // GIVE OWNERSHIP TO NEW BADGE
            cosmeticsData.badges[data.id].owner = [
                ...cosmeticsData.badges[data.id].owner,
                ...data.owner,
            ];

            return cosmeticsData;
        });
    } else if (cosmetic_data.paints[data.id]) {
        // PAINT
        cosmetics.update((cosmeticsData) => {
            for (const paint of Object.values(cosmeticsData.paints)) {
                // REMOVE OLD PAINT OWNER
                paint.owner = paint.owner.filter(
                    (c) => !mappedIDs.includes(c.id + "-" + c.platform),
                );
            }

            // GIVE OWNERSHIP TO NEW PAINT
            cosmeticsData.paints[data.id].owner = [
                ...cosmeticsData.paints[data.id].owner,
                ...data.owner,
            ];

            return cosmeticsData;
        });
    }

    //console.log("Created entitlement:", data);
});

services["7TV"].ws.on("delete_entitlement", (data) => {
    let whatToDelete: "badges" | "paints" | undefined;

    if (cosmetic_data.badges[data.id]) {
        // BADGE
        whatToDelete = "badges";
    } else if (cosmetic_data.paints[data.id]) {
        // PAINT
        whatToDelete = "paints";
    }

    const mappedIDs = data.owner.map((c) => c.id + "-" + c.platform);

    cosmetics.update((cosmeticsData) => {
        if (typeof whatToDelete == "string" && whatToDelete in cosmeticsData) {
            for (const entitlement of Object.values(
                cosmeticsData[whatToDelete],
            ) as (Paint | SevenTVBadge)[]) {
                entitlement.owner = entitlement.owner.filter(
                    (c) => !mappedIDs.includes(c.id + "-" + c.platform),
                );
            }
        }

        return cosmeticsData;
    });

    //console.log("Deleted entitlement:", data);
});

// ANCHOR BTTV WEBSOCKET
services["BTTV"].ws.on("open", () => {
    if (
        globals["channels"]["TWITCH"]["ID"] &&
        emote_data["BTTV"].channel[globals["channels"]["TWITCH"]["ID"]]?.length
    ) {
        services["BTTV"].ws.subscribe(globals["channels"]["TWITCH"]["ID"]); // SET CHANGES
    }
});

services["BTTV"].ws.on("add_emote", (id, data) => {
    if (id && emote_data["BTTV"]["channel"][id]) {
        emotes.update((emoteData) => {
            const found_set = emoteData["BTTV"]["channel"][id];

            found_set.push(data);

            return emoteData;
        });
    }

    //console.log("Emote added:", id, data);
});

services["BTTV"].ws.on("remove_emote", (id, data) => {
    if (id && emote_data["BTTV"]["channel"][id]) {
        emotes.update((emoteData) => {
            emoteData["BTTV"]["channel"][id] = emoteData["BTTV"]["channel"][
                id
            ].filter((emote: ParsedEmote) => emote.emote_id !== data); // REMOVE EMOTE FROM SET

            return emoteData;
        });
    }

    //console.log("Emote removed:", id, data);
});

services["BTTV"].ws.on("rename_emote", (id, data) => {
    if (id && emote_data["BTTV"]["channel"][id]) {
        emotes.update((emoteData) => {
            const found_set = emoteData["BTTV"]["channel"][id];
            const found_emote = found_set.find(
                (emote: ParsedEmote) => emote.emote_id == data.id,
            );

            if (found_emote) found_emote.name = data.code;

            return emoteData;
        });
    }

    //console.log("Emote renamed:", id, data);
});
