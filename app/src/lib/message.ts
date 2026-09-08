import { messages } from "./chat";

export function removeMessage(id: string, platform?: Platforms) {
    messages.update((arr) => {
        const msg = arr.find(
            (m) =>
                ("tags" in m ? m.tags["id"] == id : m["id"] == id) &&
                (!platform || m["service"] == platform),
        );

        if (msg) msg.removed = true;

        return arr;
    });
}
