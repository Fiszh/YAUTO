import { API_URL } from "./global";

export const faqItems = [
    {
        i18nKey: "pages.help.faq_items.item_1",
    },
    {
        i18nKey: "pages.help.faq_items.item_2",
    },
    {
        i18nKey: "pages.help.faq_items.item_3",
        links: [
            { name: "uniiDev", url: API_URL + "/twitch/528761326" },
            { name: "ftk789", url: API_URL + "/twitch/166427338" },
            { name: "creepycode", url: API_URL + "/twitch/404660262" },
        ],
    },
    {
        i18nKey: "pages.help.faq_items.item_4",
        commands: [
            {
                cmd: "!reloadchat",
                descKey: "pages.help.faq_items.item_4.commands.reloadchat",
            },
            {
                cmd: "!refreshchat",
                descKey: "pages.help.faq_items.item_4.commands.refreshchat",
            },
            {
                cmd: "!reloadws",
                descKey: "pages.help.faq_items.item_4.commands.reloadws",
            },
            {
                cmd: "!reconnectchat",
                descKey: "pages.help.faq_items.item_4.commands.reconnectchat",
            },
            {
                cmd: "!chatversion",
                descKey: "pages.help.faq_items.item_4.commands.chatversion",
            },
            {
                cmd: "!hideloading",
                descKey: "pages.help.faq_items.item_4.commands.hideloading",
            },
        ],
    },
    {
        i18nKey: "pages.help.faq_items.item_5",
    },
    {
        i18nKey: "pages.help.faq_items.item_6",
    },
    {
        i18nKey: "pages.help.faq_items.item_7",
    },
    {
        i18nKey: "pages.help.faq_items.item_8",
    },
    {
        i18nKey: "pages.help.faq_items.item_9",
    },
    {
        i18nKey: "pages.help.faq_items.item_10",
    },
    {
        i18nKey: "pages.help.faq_items.item_11",
        links: [
            {
                nameKey: "pages.help.faq_items.item_11.links.here",
                url: API_URL + "/docs/",
            },
        ],
    },
    {
        i18nKey: "pages.help.faq_items.item_12",
    },
    {
        i18nKey: "pages.help.faq_items.item_13",
        links: [{ name: "GitHub", url: "https://github.com/Fiszh/UChat" }],
    },
    {
        i18nKey: "pages.help.faq_items.item_14",
    },
    {
        i18nKey: "pages.help.faq_items.item_15",
    },
    {
        i18nKey: "pages.help.faq_items.item_16",
        links: [
            { name: "Twitch", url: API_URL + "/twitch/528761326" },
            {
                name: "Discord",
                url: "https://discord.com/users/703639905691238490",
            },
        ],
    },
];
