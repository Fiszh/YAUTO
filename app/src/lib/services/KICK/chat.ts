import { messages } from "$lib/chat";
import { execCommand } from "$lib/chatCommands";
import { settings } from "$stores/settings";

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
    first_open: () => void;
    opening: () => void;
    close: () => void;
    error: (data: any) => void;
    sent: (data: any) => void;
    send_error: (data: any) => void;
    raw: (data: any) => void;
    subbed: (topic: string) => void;
};

class KICKSocket {
    url: string;
    ws: WebSocket | null;
    first_open: boolean;
    silent: boolean;
    subscriptions: string[];
    listeners: Record<string, Function[]>;

    constructor() {
        this.url =
            "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.5.0&flash=false";
        this.ws = null;
        this.first_open = true;
        this.silent = false;
        this.subscriptions = [];
        this.listeners = {};
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
            console.log("KICK WS OPEN");
            this.emit("opening");

            //this.emit("open"); -- on event connection_established
        });

        this.ws.addEventListener("message", async (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                console.error("Failed to parse JSON:", event.data);
                return;
            }

            this.emit("raw", data);

            switch (data.event) {
                case "pusher:connection_established":
                    // RESUB TO EVERY TOPIC
                    for (const topic in this.subscriptions)
                        this.subscribe(topic);

                    if (this.first_open) {
                        this.first_open = false;
                        this.emit("first_open");
                    } else {
                        this.emit("open");
                    }

                    break;
                case "pusher_internal:subscription_succeeded":
                    this.emit("subbed", data.channel as string);

                    break;
                case "App\\Events\\ChatMessageEvent":
                    let parsedMessage = JSON.parse(data.data);

                    parsedMessage.content = sanitizeInput(
                        parsedMessage.content,
                    );

                    parsedMessage = {
                        ...parsedMessage,
                        service: "KICK",
                    };

                    messages.update((msgs) => [
                        ...msgs.slice(-99),
                        parsedMessage,
                    ]);

                    break;
                case "App\\Events\\UserBannedEvent":
                    let parsedBanNotif = JSON.parse(data.data);

                    messages.update((arr) =>
                        arr.filter((item) => {
                            if (item["service"] != "KICK") return item;
                            if ("sender" in item == false) return item;
                            if (
                                item["sender"]["id"] !=
                                parsedBanNotif["user"]["id"]
                            )
                                return item;
                        }),
                    );

                    break;
                case "App\\Events\\MessageDeletedEvent":
                    if (!modActions) break;

                    let parsedDeletionNotif = JSON.parse(data.data);

                    messages.update((arr) =>
                        arr.filter((item) => {
                            if (item["service"] != "KICK") return item;
                            if (
                                item["id"] !=
                                parsedDeletionNotif["message"]["id"]
                            )
                                return item;
                        }),
                    );

                    break;
                case "App\\Events\\ChatroomClearEvent":
                    if (!modActions) break;

                    messages.update((arr) =>
                        arr.filter((item) => item["service"] != "KICK"),
                    );

                    break;
                default:
                    break;
            }
        });
    }

    subToChannelId(id: string | number, chatroom_id: string | number) {
        const topics = [
            `channel_${id}`,
            `channel.${id}`,
            `chatrooms.${chatroom_id}`,
            `chatrooms.${chatroom_id}.v2`,
            `chatroom_${chatroom_id}`,
        ];

        for (const topic of topics) this.subscribe(topic);
    }

    subscribe(topic: string, silent: boolean = this.silent, force?: boolean) {
        if (!topic) throw new Error("Missing 'topic' parameter");

        if (this.subscriptions.includes(topic) && !force) {
            if (!silent) {
                throw new Error(`Already subscribed`);
            } else {
                return;
            }
        }

        const message = {
            event: "pusher:subscribe",
            data: { auth: "", channel: topic },
        };

        if (this.ws) this.ws.send(JSON.stringify(message));

        return true;
    }

    unsubscribe(topic: string) {
        if (!topic) throw new Error("Missing 'topic' parameter");
        if (!this.subscriptions.includes(topic))
            throw new Error("Not subscribed!");

        const message = {
            event: "pusher:subscribe",
            data: { auth: "", channel: topic },
        };

        if (this.ws) this.ws.send(JSON.stringify(message));

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

export default KICKSocket;
