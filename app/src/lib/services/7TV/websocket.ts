import main from "./main.js";
const { parseSetData, parsePaintData, parseBadgeData } = main;

const id_types: Record<string, string> = {
    "entitlement.create": "id", // COSMETICS
    "user.*": "object_id", // SET CHANGES
    "emote_set.update": "object_id", // EMOTE CHANGES
};

type Conditions = WebSocket7TV.entitlement_create | Record<never, never>;

interface Options {
    url?: string;
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    autoSubscribeToNewSetId?: boolean;
    resubscribeOnReconnect?: boolean;
}

type Events = {
    open: () => void;
    opening: () => void;
    close: () => void;
    error: (data: any) => void;
    sent: (data: any) => void;
    send_error: (data: any) => void;
    raw: (data: any) => void;
    subscribed: (t: string, data: any) => void;
    unsubscribed: (id: string | number) => void;
    add_emote: (id: string, actor: string, emote: ParsedEmote[]) => void;
    remove_emote: (id: string, actor: string, emote: ParsedEmote) => void;
    rename_emote: (
        id: string,
        actor: string,
        data: {
            old: { name: string; id: string };
            new: { name: string; id: string };
            emote_data: any;
        },
    ) => void;
    set_change: (
        actor: string,
        data: {
            old_set: { name: string; id: string };
            new_set: { name: string; id: string };
            SevenTV_user_id: string;
        },
    ) => void;
    create_badge: (data: SevenTVBadge) => void;
    create_paint: (data: Paint) => void;
    create_set: (data: Types7TV.Set) => void;
    create_personal_set: (data: Types7TV.Set) => void;
    create_entitlement: (data: Types7TV.Entitlement) => void;
    delete_entitlement: (data: Types7TV.Entitlement) => void;
};

class SevenTVWebSocket {
    url: string;
    ws: WebSocket | null;
    setting: {
        reconnect: boolean;
        reconnectInterval: number;
        maxReconnectAttempts: number;
        autoSubscribeToNewSetId: boolean;
        resubscribeOnReconnect: boolean;
    };
    subscriptions: Record<string, any>;
    caughtPersonalSets: any[];
    listeners: Record<string, Function[]>;

    constructor(options: Options = {}) {
        this.url = options.url ?? "wss://events.7tv.io/v3";
        this.ws = null;
        this.setting = {
            reconnect: options.reconnect ?? false,
            reconnectInterval: options.reconnectInterval ?? 1000,
            maxReconnectAttempts: options.maxReconnectAttempts ?? Infinity,
            autoSubscribeToNewSetId: options.autoSubscribeToNewSetId ?? true,
            resubscribeOnReconnect: options.resubscribeOnReconnect ?? true,
        };
        this.subscriptions = {};
        this.caughtPersonalSets = [];
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
            console.log("7TV WS OPENING");
            this.emit("opening");

            // RESUB TO EVERY TOPIC
            if (this.setting.resubscribeOnReconnect) {
                for (const id in this.subscriptions) {
                    for (const type in this.subscriptions[id]) {
                        const condition = this.subscriptions[id][type];
                        if (!this.subscriptions[id]?.[type]) {
                            this.subscribe(id, type, condition);
                        }
                    }
                }
            } else {
                this.subscriptions = [];
            }

            console.log("7TV WS OPEN");
            this.emit("open");
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

            if (data?.d?.command == "SUBSCRIBE")
                this.emit("subscribed", data?.t, data?.d?.data);

            if (!data?.d?.type || !data?.d?.body) return;

            const message_data = data.d;
            const message_body = message_data.body;

            //console.log(message_data);

            // if (message_data["session_id"]) {
            //     console.log("7TV WS OPEN");
            //     this.emit("open");
            // }

            switch (message_data.type as string) {
                case "emote_set.update":
                    const actor: string = message_body?.actor
                        ? message_body.actor.display_name &&
                          /^[\x20-\x7E]*$/.test(message_body.actor.display_name)
                            ? message_body.actor.display_name
                            : message_body.actor.username
                        : "UNKNOWN";

                    if (message_body.pushed) {
                        const emote_data: any[] = message_body.pushed.map(
                            (emote: any) => emote.value,
                        );
                        const parsed_emote_data =
                            await parseSetData(emote_data);

                        this.emit(
                            "add_emote",
                            message_body.id,
                            actor,
                            parsed_emote_data,
                        ); // SET ID, EMOTE INFO
                    } else if (message_body.pulled) {
                        const emote_data = message_body.pulled.map(
                            (emote: any) => emote.old_value,
                        );
                        const parsed_emote_data =
                            await parseSetData(emote_data);
                        for (const emote of parsed_emote_data) {
                            this.emit(
                                "remove_emote",
                                message_body.id,
                                actor,
                                emote,
                            ); // SET ID, EMOTE INFO
                        }
                    } else if (message_body.updated) {
                        for (const emote of message_body.updated) {
                            const new_emote_data = await parseSetData([
                                emote.value,
                            ]);
                            const old_value = emote.old_value;
                            const new_value = emote.value;
                            this.emit("rename_emote", message_body.id, actor, {
                                old: { name: old_value.name, id: old_value.id },
                                new: { name: new_value.name, id: new_value.id },
                                emote_data: new_emote_data[0],
                            }); // SET ID, { OLD INFO, NEW INFO }
                        }
                    } else {
                        //console.log("Unknown set update message from 7TV WebSocket: ", data);
                    }

                    break;
                case "user.update": // RESUB TO NEW SET ID
                    if (message_body.updated) {
                        const actor: string = message_body?.actor
                            ? message_body.actor.display_name ||
                              message_body.actor.username ||
                              "UNKNOWN"
                            : "UNKNOWN";

                        const unique = [];
                        const seen = new Set();

                        for (const item of message_body.updated) {
                            const copy = { ...item };
                            delete copy.index;

                            const key = JSON.stringify(copy);

                            if (!seen.has(key)) {
                                seen.add(key);
                                unique.push(item);
                            }
                        }

                        message_body.updated = unique;

                        for (const emote_set_update of message_body.updated) {
                            if (emote_set_update?.key === "style") continue;

                            const set_data = {
                                old_set: {
                                    name: emote_set_update.value[0].old_value
                                        .name,
                                    id: emote_set_update.value[0].old_value.id,
                                },
                                new_set: {
                                    name: emote_set_update.value[0].value.name,
                                    id: emote_set_update.value[0].value.id,
                                },
                                SevenTV_user_id: message_body.id,
                            };

                            this.emit("set_change", actor, set_data);

                            if (this.setting.autoSubscribeToNewSetId) {
                                this.unsubscribe(
                                    set_data.old_set.id,
                                    "emote_set.update",
                                );
                                this.subscribe(
                                    set_data.new_set.id,
                                    "emote_set.update",
                                );
                            }
                        }
                    }

                    break;
                case "cosmetic.create":
                    if (!message_body.object?.kind) return;

                    switch (message_body.object.kind) {
                        case "BADGE":
                            const badge_data = message_body.object.data;
                            if (!badge_data) return;

                            const badge_message = parseBadgeData(badge_data);

                            this.emit("create_badge", badge_message);

                            break;
                        case "PAINT":
                            const paint_data = message_body.object.data;
                            if (!paint_data) return;

                            const paint_message =
                                await parsePaintData(paint_data);

                            this.emit("create_paint", paint_message);

                            break;
                        default:
                            //console.log(`New cosmetic kind: ${message_body.object.kind}`, message_body.object);

                            break;
                    }

                    break;
                case "emote_set.create":
                    const set_object = message_body.object;

                    const set_data: Types7TV.Set = {
                        id: set_object.id,
                        name: set_object.name,
                        owner: set_object.owner?.connections,
                        flags: message_body.object?.flags || 0,
                        emotes: [],
                    };

                    this.caughtPersonalSets.push(set_data);

                    /*
                    4 - PERSONAL SETS
                    11 - SPECIAL SETS (LIKE NNYS)
                    */

                    this.emit(
                        ![4, 11].includes(message_body.object?.flags)
                            ? "create_set"
                            : "create_personal_set",
                        set_data,
                    );

                    break;
                case "entitlement.create":
                case "entitlement.delete":
                    const entitlement_object = message_body.object;

                    const entitlement_data: Types7TV.Entitlement = {
                        id: Number(entitlement_object.id)
                            ? entitlement_object.id
                            : entitlement_object.ref_id,
                        kind: entitlement_object.kind,
                        owner: entitlement_object.user?.connections,
                    };

                    this.emit(
                        message_data.type.split(".").reverse().join("_"),
                        entitlement_data,
                    );

                    break;
                default:
                    //console.log("Unknown message from 7TV WebSocket: ", data);

                    break;
            }
        });

        this.ws.addEventListener("close", () => {
            this.ws = null;
            console.log("closed");
            this.emit("close");

            if (this.setting.reconnect) {
                console.log(
                    `reconnecting in ${this.setting.reconnectInterval / 1000}s`,
                );
                setTimeout(
                    () => this.connect(),
                    this.setting.reconnectInterval,
                );
            } else {
                this.subscriptions = {};
            }
        });

        this.ws.addEventListener("error", (error) => {
            console.error(error);
            this.emit("error", error);
        });
    }

    async subscribe(
        id: string | number,
        type: string,
        condition?: Conditions,
        silent?: boolean,
    ) {
        if (!id) throw new Error("Missing 'id' parameter");
        if (!type) throw new Error("Missing 'type' parameter");

        const idKey = String(id);
        if (
            idKey === "__proto__" ||
            idKey === "constructor" ||
            idKey === "prototype"
        )
            throw new Error("Invalid 'id' parameter");

        if (this.subscriptions?.[idKey]?.[type]) {
            if (!silent) {
                throw new Error(`Already subscribed`);
            } else {
                return;
            }
        }

        let id_type: Record<string, any> = { id };
        const idField = id_types[type] || "id";
        if (
            idField === "__proto__" ||
            idField === "constructor" ||
            idField === "prototype"
        )
            throw new Error("Invalid subscription id field");

        if (id_types[type]) id_type = { [idField]: String(id) };

        const sub_condition = { ...condition, ...id_type };

        const message = {
            op: 35,
            t: Date.now(),
            d: {
                type,
                condition: sub_condition,
            },
        };

        if (this.ws) this.ws.send(JSON.stringify(message));

        if (!this.subscriptions[idKey]) this.subscriptions[idKey] = {};

        this.subscriptions[idKey][type] = sub_condition;

        return true;
    }

    async unsubscribe(id: string | number, type: string) {
        if (!id) throw new Error("Missing 'id' parameter");
        if (!type) throw new Error("Missing 'type' parameter");

        if (!this.subscriptions[id])
            throw new Error(`${id} is not subscribed to anything`);

        if (!this.subscriptions[id][type])
            throw new Error(`${id} is not subscribed to ${type}`);

        const message = {
            op: 36,
            t: Date.now(),
            d: {
                type,
                condition: this.subscriptions[id][type],
            },
        };

        if (this.ws) this.ws.send(JSON.stringify(message));

        delete this.subscriptions[id][type];

        this.emit("unsubscribed", id);

        return true;
    }

    send(message: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
            this.emit("sent", message);
        } else {
            const err = new Error(
                "WebSocket is not open. Cannot send message.",
            );
            this.emit("send_error", err);
        }
    }

    close = () => this.ws?.close();
}

export default SevenTVWebSocket;
