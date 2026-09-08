import * as logosModule from "$components/logos.svelte";
import type { Snippet } from "svelte";
const logos: Record<string, Snippet<[boolean]>> = (logosModule as any).logos ??
(logosModule as any).default?.logos ??
{};
import { flags } from "$lib/bitmap";
import { writable } from "svelte/store";
import { isPogly } from "$lib/pogly";
import { getFontFamilys } from "$lib/fonts";

export interface DefaultSetting {
    param: string;
    hide?: boolean;
    previewReact?: boolean;
}

export interface NumberSetting extends DefaultSetting {
    type: "number";
    value: string;
    default?: string;
}

export interface TextSetting extends DefaultSetting {
    type: "text";
    value: string;
    default?: string;
    list?: boolean;
}

export interface BooleanSetting extends DefaultSetting {
    type: "boolean";
    value: boolean;
    default?: boolean;
}

export interface ColorPickerSetting extends DefaultSetting {
    type: "color-picker";
    value: string;
    default?: string;
}

export interface SliderSetting extends DefaultSetting {
    type: "slider";
    value: string;
    min: string;
    max: string;
    default?: string;
}

export interface SelectorSetting extends DefaultSetting {
    type: "selector";
    value: number;
    default?: number;
    selectors: {
        enabled: boolean;
        label: string;
        icon?: Snippet<[boolean]>;
        bitmap: number;
        disabled?: boolean;
    }[];
}

export interface DropdownSetting extends DefaultSetting {
    type: "dropdown";
    value: string;
    list: string[] | (() => string[] | Promise<string[]>) | Promise<string[]>;
    default?: string;
}

export type Setting =
    | NumberSetting
    | TextSetting
    | BooleanSetting
    | ColorPickerSetting
    | SliderSetting
    | SelectorSetting
    | DropdownSetting;

const defaultEmoteSize = "25";

export const setEmoteSize = writable<string>(defaultEmoteSize);

export const configs: Setting[] = [
    {
        type: "boolean",
        value: true,
        param: "msgBold",
    },
    {
        type: "boolean",
        value: false,
        param: "msgCaps",
    },
    {
        type: "boolean",
        param: "smoothScroll",
        value: true,
    },
    {
        type: "text",
        value: "Geist",
        param: "font",
    },
    // {
    //     type: "dropdown",
    //     value: "Geist",
    //     list: getFontFamilys,
    //     param: "font",
    // },

    {
        type: "color-picker",
        value: "#FFFFFF",
        param: "fontColor",
    },
    {
        type: "number",
        param: "fontSize",
        value: "20",
        previewReact: false,
    },
    {
        type: "boolean",
        value: false,
        param: "fontStroke",
    },
    {
        type: "slider",
        param: "fontShadow",
        value: "10",
        min: "0",
        max: "10",
    },
    {
        type: "number",
        param: "emoteSize",
        value: defaultEmoteSize,
        previewReact: false,
    },
    {
        type: "boolean",
        param: "gifs",
        value: false,
        previewReact: false,
    },
    {
        type: "number",
        param: "gifSize",
        value: String(Number(defaultEmoteSize) * 4),
        previewReact: false,
    },
    {
        type: "number",
        param: "fadeOut",
        value: "0",
        previewReact: false,
    },
    {
        type: "selector",
        value: 0,
        selectors: [
            {
                label: "UChat",
                enabled: true,
                icon: logos["uchat"],
                bitmap: 1 << 0,
            },
            {
                label: "Twitch",
                enabled: true,
                icon: logos["twitch"],
                bitmap: 1 << 1,
            },
            {
                label: "Kick",
                enabled: true,
                icon: logos["kick"],
                bitmap: 1 << 2,
            },
            { label: "7TV", enabled: true, icon: logos["7tv"], bitmap: 1 << 3 },
            {
                label: "BTTV",
                enabled: true,
                icon: logos["bttv"],
                bitmap: 1 << 4,
            },
            { label: "FFZ", enabled: true, icon: logos["ffz"], bitmap: 1 << 5 },
            {
                label: "Chatterino",
                enabled: true,
                icon: logos["chatterino"],
                bitmap: 1 << 6,
            },
            {
                label: "Homies",
                enabled: false,
                icon: logos["chatterino-homies"],
                bitmap: 1 << 7,
            },
            {
                label: "PolandBOT",
                enabled: true,
                icon: logos["polandbot"],
                bitmap: 1 << 8,
            },
            {
                label: "Turteg",
                enabled: true,
                icon: logos["turteg"],
                bitmap: 1 << 9,
            },
        ],
        param: "badges",
    },
    {
        type: "boolean",
        value: false,
        hide: true,
        param: "badgesTTV",
    },
    {
        type: "boolean",
        value: true,
        param: "redeem",
    },
    {
        type: "boolean",
        value: true,
        param: "bots",
    },
    {
        type: "text",
        value: "",
        param: "userBL",
        list: true,
    },
    {
        type: "text",
        value: "",
        param: "prefixBL",
        list: true,
    },
    {
        type: "boolean",
        value: true,
        param: "modAction",
    },
    {
        type: "boolean",
        value: false,
        param: "mentionColor",
    },
    {
        type: "boolean",
        value: true,
        param: "paints",
    },
    {
        type: "boolean",
        value: true,
        param: "paintShadows",
    },
    {
        type: "boolean",
        value: false,
        hide: true,
        param: "lastMsg",
    },
    {
        type: "boolean",
        value: false,
        hide: true,
        param: "clearLive",
    },
    {
        type: "boolean",
        value: true,
        param: "track",
    },
];

for (const config of configs) {
    if (config["type"] == "selector")
        config["value"] = flags.getDefault(config["selectors"]);

    config["default"] = config["value"] as Setting["default"];
}

export const config = configs;

export const settings = writable<Setting[]>(configs.map((c) => ({ ...c })));
export const savedSettings = writable<Record<string, any>>([]);
export const channelID = writable<string>("");

export const settingsParams = writable<Record<string, Setting["value"]>>({});

type ChatSettings = Record<string, Setting["value"]>;
export let chatSettings: ChatSettings = {};

settings.subscribe((cfg) => {
    for (const setting of cfg) {
        chatSettings[setting.param] = setting.value;
    }
});
