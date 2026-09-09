import { messages } from "$lib/chat";
import { execCommand } from "$lib/chatCommands";
import { generateUUID } from "$lib/overlayIndex";
import { WS_URL } from "$stores/global";
import { settings } from "$stores/settings";
import type { YTNodes } from "youtubei.js";

let modActions = false;

settings.subscribe((cfg) => {
    const foundSetting0 = cfg.find(
        (setting) => setting.param == "modAction",
    ) || {
        value: true,
    };

    if (typeof foundSetting0.value == "boolean")
        modActions = foundSetting0.value;
});

type Events = {
    open: () => void;
    opening: () => void;
    close: () => void;
    error: (data: any) => void;
    raw: (data: any) => void;
};

class YOUTUBESocket {
    url: string;
    ws: WebSocket | null;
    listeners: Record<string, Function[]>;
    channel_id: string;

    constructor(channel_id: string) {
        this.url = WS_URL + "/youtube";
        this.ws = null;
        this.listeners = {};

        this.channel_id = channel_id;
    }

    on<K extends keyof Events>(event: K, cb: Events[K]) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event]!.push(cb);
    }

    emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) {
        if (!this.listeners[event]) return;
        for (const cb of this.listeners[event]!) cb(...args);
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.addEventListener("open", () => {
            console.log("YOUTUBE WS OPEN");
            this.emit("opening");
        });

        this.ws.addEventListener("message", async (event) => {
            //console.log(event);
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                return console.error("Failed to parse JSON:", event.data);
            }

            this.emit("raw", data);

            switch (data["type"]) {
                case "welcome":
                    this.subscribe(this.channel_id);

                    this.emit("open");

                    break;
                case "AddChatItemAction":
                    //console.log(data);

                    const item = (data as YTNodes.AddChatItemAction)["item"];

                    if (
                        "author" in item == false ||
                        "id" in item == false ||
                        "message" in item == false
                    )
                        break;

                    messages.update((msgs) => {
                        const filtered = msgs.filter((m) => m.id != item.id);
                        return [
                            ...filtered.slice(-99),
                            { ...item, service: "GOOGLE" },
                        ];
                    });

                    break;
                case "RemoveChatItemByAuthorAction":
                    if (!modActions) break;

                    messages.update((arr) =>
                        arr.filter((item) => {
                            if (item["service"] != "GOOGLE") return item;
                            if ("author" in item == false) return item;
                            if (
                                item["author"]["id"] !=
                                data["external_channel_id"]
                            )
                                return item;
                        }),
                    );

                    break;
                case "RemoveChatItemAction":
                    if (!modActions) break;

                    messages.update((arr) =>
                        arr.filter((item) => {
                            if (item["service"] != "GOOGLE") return item;
                            if ("author" in item == false) return item;
                            if (item["id"] != data["target_item_id"])
                                return item;
                        }),
                    );

                    break;
                default:
                    break;
            }
        });
    }

    subscribe(channel_id: string) {
        if (!channel_id) throw new Error("Missing 'channel_id' parameter");

        if (this.ws)
            this.ws.send(
                JSON.stringify({ op: "subscribe", channel: channel_id }),
            );

        return true;
    }
}

export function sanitizeInput(input: string): string {
    if (typeof input !== "string") return input;

    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\//g, "&#x2F;");
}

export default YOUTUBESocket;
