import { get } from "svelte/store";

import { API_URL, badges, emotes, globals } from "$stores/global";

import {
    getSavedSet,
    subscribeEventAPIToSharedChatUser,
} from "../overlayIndex";

import SevenTV_main from "$lib/services/7TV/main";
import BTTV_main from "$lib//services/BTTV/main";
import FFZ_main from "$lib//services/FFZ/main";

let emote_data = get(emotes);
let badge_data = get(badges);

emotes.subscribe((data) => (emote_data = data));
badges.subscribe((data) => (badge_data = data));

let processing_ids: string[] = [];
export async function getChannelEmotesViaTwitchID(twitchID: string) {
    if (!twitchID || twitchID === "0" || processing_ids.includes(twitchID))
        return;

    if (twitchID != globals["channels"]["TWITCH"]["ID"])
        globals.inSharedChat = true;

    processing_ids.push(twitchID); // prevent API spam

    // 7TV
    try {
        const channel_set = getSavedSet(twitchID, "TWITCH");

        if (!channel_set) {
            const SevenTV_user_data =
                await SevenTV_main.user.byTwitchID(twitchID);

            if (SevenTV_user_data) {
                emotes.update((emoteData) => {
                    if (
                        "emote_data" in SevenTV_user_data &&
                        "emote_set_id" in SevenTV_user_data
                    )
                        emoteData["7TV"]["channel"] = [
                            ...emoteData["7TV"]["channel"],
                            {
                                id: SevenTV_user_data.emote_set_id,
                                owners: SevenTV_user_data.connections,
                                emotes: SevenTV_user_data.emote_data,
                            },
                        ];

                    return emoteData;
                });
            }
        }
    } catch (e) {
        console.error(`7TV error for ${twitchID}:`, e);
    }

    // BTTV
    try {
        if (!emote_data["BTTV"]["channel"][twitchID]) {
            const bttvData = await BTTV_main.getEmoteData(twitchID);

            emotes.update((emoteData) => {
                emoteData["BTTV"]["channel"][twitchID] = bttvData;

                return emoteData;
            });
        }
    } catch (e) {
        console.error(`BTTV error for ${twitchID}:`, e);
    }

    // FFZ
    try {
        if (!emote_data["FFZ"]["channel"][twitchID]) {
            const ffzData = await FFZ_main.getUserData(twitchID);

            emotes.update((emoteData) => {
                emoteData["FFZ"]["channel"][twitchID] = ffzData?.set || [];

                return emoteData;
            });

            if (twitchID == globals["channels"]["TWITCH"]["ID"]) {
                badges.update((badgeData) => {
                    if (ffzData.badges?.vip?.length) {
                        badgeData["FFZ"]["user"]["vip"] =
                            ffzData.badges.vip.reduce(
                                (max: Record<string, any>, item: any) => {
                                    return parseInt(item.scale) >
                                        parseInt(max.scale)
                                        ? item
                                        : max;
                                },
                            ).url;
                    }

                    if (ffzData.badges?.mod?.length) {
                        badgeData["FFZ"]["user"]["mod"] =
                            ffzData.badges.mod.reduce(
                                (max: Record<string, any>, item: any) => {
                                    return parseInt(item.scale) >
                                        parseInt(max.scale)
                                        ? item
                                        : max;
                                },
                            ).url;
                    }

                    if (ffzData.badges?.user_badge_ids) {
                        badgeData["FFZ"]["user"]["user"] = Object.fromEntries(
                            Object.entries(
                                ffzData.badges.user_badge_ids as Record<
                                    string,
                                    string[]
                                >,
                            ).flatMap(([badge, users]) =>
                                users.map(
                                    (user: any) =>
                                        [user, badge] as [string, string],
                                ),
                            ),
                        );
                    }

                    return badgeData;
                });
            }
        }
    } catch (e) {
        console.error(`FFZ error for ${twitchID}:`, e);
    }

    // CHANNEL BADGE
    try {
        if (!badge_data.channel[twitchID]) {
            const avatar = await getAvatarViaID(twitchID);
            if (avatar) {
                badges.update((badgeData) => {
                    badgeData.channel[twitchID] = avatar;

                    return badgeData;
                });
            }
        }
    } catch (e) {
        console.error(`Badge error for ${twitchID}:`, e);
    }

    if (twitchID != globals["channels"]["TWITCH"]["ID"])
        await subscribeEventAPIToSharedChatUser(twitchID);

    // remove from processing
    processing_ids = processing_ids.filter((id) => id !== twitchID);
}

async function getAvatarViaID(user_id: string) {
    const response = await fetch(API_URL + `/avatar?id=${user_id}`);

    if (!response.ok) return false;

    const data = await response.json();

    return data?.avatar || false;
}

export async function getGlobalEmotes() {
    const SevenTV_data = await SevenTV_main.emoteSet.bySetID("global");
    const BTTV_data = await BTTV_main.getGlobalEmoteSet();
    const FFZ_data = await FFZ_main.getGlobalEmotes();

    emotes.update((emoteData) => {
        emoteData["7TV"].global = SevenTV_data;
        emoteData["BTTV"].global = BTTV_data;
        emoteData["FFZ"].global = FFZ_data;

        return emoteData;
    });
}
