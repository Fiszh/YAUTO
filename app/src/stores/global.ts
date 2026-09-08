import type { Badges } from "$types/badges";
import { writable } from "svelte/store";

export const isMobile = writable<boolean>(false);

interface LoadingInfo {
    text: string | undefined;
    type: string | undefined;
}

export const loadingInfo = writable<LoadingInfo>({
    text: undefined,
    type: undefined,
});

export interface GlobalEmotes {
    "7TV": {
        global: ParsedEmote[];
        channel: SavedSevenTVSet[] | never[];
    };
    BTTV: {
        global: ParsedEmote[];
        channel: Record<string, ParsedEmote[]>;
    };
    FFZ: {
        global: ParsedEmote[];
        channel: Record<string, ParsedEmote[]>;
    };
    BITS: Emotes.Bits[];
}

export interface GlobalBadges {
    UChat: Badges.UChat[];
    TTV: {
        global: Badges.Twitch[];
        channel: Badges.Twitch[];
    };
    KICK: Badges.Kick[];
    BTTV: {
        global: Badges.BTTV[];
    };
    FFZ: {
        global: Badges.FFZ[];
        user: {
            vip: string;
            mod: string;
            user: Record<string, number | string>;
        };
    };
    OTHER: {
        Chatterino: Badges.Chatterino[];
        ChatterinoHomies: Badges.Chatterino[];
        ChatterinoHomiesCustom: Badges.ChatterinoHomiesCustom[];
        PolandBOT: Record<string, string[]>;
        TurtegBot: Badges.TurtegBadge[];
    };
    channel: Record<string, string>;
}

export const emotes = writable<GlobalEmotes>({
    "7TV": { global: [], channel: [] },
    BTTV: { global: [], channel: {} },
    FFZ: { global: [], channel: {} },
    BITS: [],
});

export const badges = writable<GlobalBadges>({
    UChat: [],
    TTV: { global: [], channel: [] },
    KICK: [],
    BTTV: { global: [] },
    FFZ: { global: [], user: { vip: "", mod: "", user: {} } },
    OTHER: {
        Chatterino: [],
        ChatterinoHomies: [],
        ChatterinoHomiesCustom: [],
        PolandBOT: {},
        TurtegBot: [],
    },
    channel: {},
});

interface Globals {
    custom_bots: string[];

    inSharedChat: boolean;

    userNameColor: Record<string, string>;

    channels: {
        TWITCH: {
            ID: string | null;
            Name: string | null;
        };
        KICK: {
            Name: string | null;
            channelID: string | null;
            chatroomID: string | null;
            userID: string | null;
        };
        GOOGLE: {
            ID: string | null;
            Handle: string | null;
        };
    };
}

export const globals: Globals = {
    // BOT LIST
    custom_bots: [
        "poland_bot",
        "ftk789_bot",
        "mrsmalvic",
        "gofishgame",
        "reapsex",
        "timeoutwithbits", // from speedyemperor
        "soundalerts", // from speedyemperor
        "rancbot", // from fehleno
        "waga_bot", // from fehleno
        "tangiabot",
    ],
    /*
    If you want your bot added, open a PR on the repo.
    I’ll probably accept it, but no guarantees.
    Make sure your bot isn’t on the FFZ bots list or doesn't have the Twitch Chat Bot badge before submitting
    */

    //TTV
    inSharedChat: false,

    channels: {
        TWITCH: {
            ID: null,
            Name: null,
        },
        KICK: {
            Name: null,
            channelID: null,
            chatroomID: null,
            userID: null,
        },
        GOOGLE: {
            ID: null,
            Handle: null,
        },
    },

    // OTHER
    userNameColor: {},
};

export const API_URL = import.meta.env.API_URL;
export const WS_URL = import.meta.env.WS_URL;
