const twitch_irc = new EventTarget();

let TTV_IRC_WS;
let IRC_is_connected = false;

let reconnectAttempts = 0;
const MAX_RECONNECTS = 10;

let heartbeatInterval = null;
let heartbeatTimeout = null;

function connect(channel_name) {
    if (!channel_name || IRC_is_connected) { return; };

    twitch_irc.dispatchEvent(new CustomEvent("opening", { detail: "Twitch IRC connecting." }));

    TTV_IRC_WS = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    TTV_IRC_WS.addEventListener('open', () => {
        reconnectAttempts = 0;

        TTV_IRC_WS.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
        TTV_IRC_WS.send(`NICK justinfan${Math.floor(Math.random() * 9999)}`);
        TTV_IRC_WS.send(`JOIN #${channel_name}`);
        console.log('Connected to Twitch IRC WebSocket');

        twitch_irc.dispatchEvent(new CustomEvent("open", { detail: "Twitch IRC connection has been opened." }));

        IRC_is_connected = true;

        // FIX TRY
        heartbeatInterval = setInterval(() => {
            if (TTV_IRC_WS.readyState === WebSocket.OPEN) {
                TTV_IRC_WS.send('PING');

                clearTimeout(heartbeatTimeout);
                heartbeatTimeout = setTimeout(() => {
                    console.warn('No PONG, reconnecting...');
                    TTV_IRC_WS.close();
                }, 20000);
            }
        }, 20000);
    });

    TTV_IRC_WS.addEventListener('message', (event) => {
        const messages = event.data.split('\r\n');

        for (const message of messages) {
            if (!message) { continue; };

            let parsed = parseIrcLine(message);

            switch (parsed?.command) {
                case "PING":
                    console.log('PING...');

                    TTV_IRC_WS.send('PONG :tmi.twitch.tv');

                    console.log('PONG...');

                    break;
                case "RECONNECT":
                    console.log('Twitch sent RECONNECT, reconnecting...');

                    TTV_IRC_WS.close();

                    return;
                case "PONG":
                    clearTimeout(heartbeatTimeout);

                    break;
                default:
                    if (parsed?.message && parsed?.tags) {
                        const parsed_message = parsed["message"];

                        if (parsed_message.startsWith('\x01ACTION') && parsed_message.endsWith('\x01')) {
                            parsed.tags["action"] = true;
                            parsed["message"] = parsed["message"].slice(8, -1);
                        }
                    }

                    twitch_irc.dispatchEvent(new CustomEvent(parsed.command, { detail: parsed }));

                    break;
            }
        }
    });

    TTV_IRC_WS.addEventListener('close', () => {
        console.log('Disconnected from Twitch IRC');

        clearInterval(heartbeatInterval);
        clearTimeout(heartbeatTimeout);

        IRC_is_connected = false;

        reconnectAttempts++;

        if (reconnectAttempts <= MAX_RECONNECTS) {
            setTimeout(() => connect(channel_name), 1000 * reconnectAttempts);

            twitch_irc.dispatchEvent(new CustomEvent("close", { detail: "Twitch IRC connection has been closed, reconnecting." }));
        } else {
            twitch_irc.dispatchEvent(new CustomEvent("reconnect_limit_reached", { detail: "Twitch IRC failed to reconnect after 10 tries. Refresh the page or the source to retry." }));
            return;
        }
    });

    TTV_IRC_WS.addEventListener('error', (err) => {
        console.error('WebSocket error:', err);
    });
}

function disconnect() {
    if (TTV_IRC_WS) {
        TTV_IRC_WS.close();
        TTV_IRC_WS = null;
    }
    IRC_is_connected = false;
    clearInterval(heartbeatInterval);
    clearTimeout(heartbeatTimeout);
}

function parseIrcLine(line, parseTagCb) {
    if (!line) return;

    const ircEscapedChars = { s: " ", n: "\n", r: "\r", ":": ";", "\\": "\\" };
    const ircUnescapedChars = { " ": "s", "\n": "n", "\r": "r", ";": ":", "\\": "\\" };

    function unescapeIrc(value) {
        if (!value || !value.includes("\\")) return value;
        return value.replace(/\\[snr:\\]/g, (match) => ircEscapedChars[match[1]]);
    }

    function parseTag(rawKey, rawValue, messageParams, cb) {
        const unescapedKey = unescapeIrc(rawKey);
        const unescapedValue = unescapeIrc(rawValue);

        let key = unescapedKey;
        let value = unescapedValue;

        if (value === "") value = null;

        const boolKeys = new Set(["mod", "subscriber", "turbo", "emote-only", "first-msg", "returning-chatter"]);
        if (boolKeys.has(key)) value = value === "1";

        if (key === "emotes" && typeof value === "string") {
            const emotesObj = {};
            value.split("/").forEach(part => {
                const [id, ranges] = part.split(":");
                if (id && ranges) emotesObj[id] = ranges.split(",");
            });
            value = emotesObj;
        }

        if (key === "badges" && typeof value === "string") {
            const badgesObj = {};
            value.split(",").forEach(part => {
                const [name, val] = part.split("/");
                if (name && val) badgesObj[name] = val;
            });
            value = badgesObj;
        }

        if (cb) [key, value] = cb(key, value, messageParams ?? []);

        return { key, value, rawKey: unescapedKey, rawValue: unescapedValue };
    }

    function parseTagsFromString(tagsRawString, messageParams, cb) {
        const tags = {};
        if (!tagsRawString) return tags;

        tagsRawString.split(";").forEach(str => {
            const [rawKey, rawValue = ""] = str.split("=");
            const { key, value, rawKey: cleanKey, rawValue: cleanValue } = parseTag(rawKey, rawValue, messageParams, cb);

            tags[key] = value;
            tags[`${key}-raw`] = cleanValue === "" ? null : cleanValue;
        });

        return tags;
    }

    function parsePrefix(prefixRaw) {
        const prefix = {};
        if (!prefixRaw) return prefix;
        if (prefixRaw.includes("!")) {
            const [nick, userHost] = prefixRaw.split("!");
            prefix.nick = nick;
            [prefix.user, prefix.host] = userHost.includes("@") ? userHost.split("@") : [userHost, undefined];
        } else if (prefixRaw.includes("@")) {
            [prefix.user, prefix.host] = prefixRaw.split("@");
        } else {
            prefix.host = prefixRaw;
        }
        return prefix;
    }

    let offset = 0;
    const getNextSpace = () => line.indexOf(" ", offset);
    const advanceToNextSpace = (start) => {
        if (start === undefined) start = getNextSpace();
        if (start === -1) {
            offset = line.length;
            return;
        }
        offset = start + 1;
    };
    const charIs = (char, start = offset) => line[start] === char;

    const raw = line;
    let tagsRawString = "";
    if (charIs("@")) {
        const tagsEnd = getNextSpace();
        tagsRawString = line.slice(1, tagsEnd);
        advanceToNextSpace(tagsEnd);
    }

    let prefix = {};
    if (charIs(":")) {
        const prefixEnd = getNextSpace();
        const prefixRaw = line.slice(offset + 1, prefixEnd);
        prefix = parsePrefix(prefixRaw);
        advanceToNextSpace(prefixEnd);
    }

    const commandEnd = getNextSpace();
    const command = line.slice(offset, commandEnd === -1 ? undefined : commandEnd);
    advanceToNextSpace(commandEnd);

    let channel = "";
    if (charIs("#")) {
        const channelEnd = getNextSpace();
        if (channelEnd === -1) {
            channel = line.slice(offset);
            advanceToNextSpace();
        } else {
            channel = line.slice(offset, channelEnd);
            advanceToNextSpace(channelEnd);
        }
    }

    const params = [];
    while (offset < line.length) {
        if (charIs(":")) {
            params.push(line.slice(offset + 1));
            break;
        }
        const nextSpace = getNextSpace();
        params.push(line.slice(offset, nextSpace));
        advanceToNextSpace(nextSpace);
    }

    const tags = parseTagsFromString(tagsRawString, params, parseTagCb);
    if (prefix.nick) tags.username = prefix.nick;

    const message = params.length > 0 ? params[params.length - 1].trimEnd() : "";

    return { raw, tags, prefix, command, channel, params, message };
}

irc = {
    connect,
    disconnect,
    events: twitch_irc
};