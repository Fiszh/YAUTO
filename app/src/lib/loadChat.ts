import {
    getBTTVBadges,
    getChatterinoBadges,
    getChatterinoHomiesBadges,
    getCustomChatterinoHomiesBadges,
    getFFZBadges,
    getMainBadges,
    getPolandBOTBadges,
    getTurtegBotBadges,
} from "$lib/badges/main";
import { getChannelEmotesViaTwitchID, getGlobalEmotes } from "$lib/emotes/main";
import { emotes, globals, loadingInfo } from "$stores/global";
import { settings } from "$stores/settings";
import { get } from "svelte/store";
import { getLastMessages } from "./chat";
import { services } from "./services";
import { getSavedSet } from "./overlayIndex";

export const initBadges = async () =>
    await Promise.allSettled([
        // BADGES
        getMainBadges(),

        // OTHER BADGES
        getBTTVBadges(),
        getFFZBadges(),
        getChatterinoBadges(),
        getChatterinoHomiesBadges(),
        getCustomChatterinoHomiesBadges(),
        getPolandBOTBadges(),
        getTurtegBotBadges(),
    ]);

export async function initChat() {
    return await Promise.allSettled([
        // BADGES
        initBadges(),

        // EMOTES
        getGlobalEmotes(),
    ]);
}

export async function loadChat(displayLoading?: boolean) {
    if (displayLoading) loadingInfo.set({ text: undefined, type: "minimal" });

    const overlaySettings = get(settings);
    console.log(overlaySettings);

    await initChat();

    if (globals["channels"]["TWITCH"]["ID"])
        await getChannelEmotesViaTwitchID(globals["channels"]["TWITCH"]["ID"]);

    if (globals["channels"]["KICK"]["userID"]) {
        const alreadyHasSet = getSavedSet(
            globals["channels"]["KICK"]["userID"],
            "KICK",
        );

        if (!alreadyHasSet) {
            const stv_user = await services["7TV"].main.user.byKickID(
                globals["channels"]["KICK"]["userID"],
            );

            if (stv_user["id"]) {
                emotes.update((emoteData) => {
                    emoteData["7TV"]["channel"] = [
                        ...emoteData["7TV"]["channel"],
                        {
                            id: stv_user.emote_set_id,
                            owners: stv_user.connections,
                            emotes: stv_user.emote_data,
                        },
                    ];

                    return emoteData;
                });
            }
        }
    }

    if (globals["channels"]["GOOGLE"]["ID"]) {
        const alreadyHasSet = getSavedSet(
            globals["channels"]["GOOGLE"]["ID"],
            "KICK",
        );

        if (!alreadyHasSet) {
            const stv_user = await services["7TV"].main.user.byYouTubeID(
                globals["channels"]["GOOGLE"]["ID"],
            );

            if (stv_user["id"]) {
                emotes.update((emoteData) => {
                    emoteData["7TV"]["channel"] = [
                        ...emoteData["7TV"]["channel"],
                        {
                            id: stv_user.emote_set_id,
                            owners: stv_user.connections,
                            emotes: stv_user.emote_data,
                        },
                    ];

                    return emoteData;
                });
            }
        }
    }

    const foundSetting = overlaySettings.find(
        (setting) => setting.param == "lastMsg",
    );
    if (
        globals["channels"]["TWITCH"]["Name"] &&
        foundSetting &&
        foundSetting.value
    )
        getLastMessages(globals["channels"]["TWITCH"]["Name"]);

    if (displayLoading) loadingInfo.set({ text: undefined, type: undefined });
}
