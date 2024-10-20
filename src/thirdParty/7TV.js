async function get7TVUserID(user_id) {
    try {
        const response = await fetch(`https://7tv.io/v3/users/twitch/${user_id}`);

        if (!response.ok) {
            throw false
        }

        const data = await response.json();
        if (data && data.user && data.user.id) {
            const user = data.user;
            if (user) {
                return user.id;
            } else {
                throw new Error('User not found');
            }
        } else {
            throw new Error('Invalid response format.');
        }
    } catch (error) {
        return 0
    }
}

async function get7TVEmoteSetID() {
    try {
        const response = await fetch(`https://7tv.io/v3/users/${SevenTVID}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        data.connections.forEach(connection => {
            if (connection.platform === 'TWITCH' && connection.emote_set) {
                SevenTVemoteSetId = connection.emote_set.id;
                console.log(FgBlue + 'Emote Set ID:', SevenTVemoteSetId + FgWhite);
            }
        });
    } catch (error) {
        console.log('Error fetching emote set ID:', error);
    }
}

async function fetch7TVEmoteData(emoteSet) {
    try {
        const response = await fetch(`https://7tv.io/v3/emote-sets/${emoteSet}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch emote data for set ${emoteSet}`);
        }
        const data = await response.json();
        if (!data.emotes) { return null }
        return data.emotes.map(emote => {
            const owner = emote.data?.owner;

            const creator = owner && Object.keys(owner).length > 0
                ? owner.display_name || owner.username || "UNKNOWN"
                : "NONE";

            const emote4x = emote.data.host.files.find(file => file.name === "4x.avif");

            return {
                name: emote.name,
                url: `https://cdn.7tv.app/emote/${emote.id}/4x.avif`,
                flags: emote.data?.flags,
                original_name: emote.data?.name,
                creator,
                emote_link: `https://7tv.app/emotes/${emote.id}`,
                site: emoteSet === 'global' ? 'Global 7TV' : '7TV',
                height: emote4x.height || 0,
                width: emote4x.width || 0,
            };
        });
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// WEBSOCKET

async function detect7TVEmoteSetChange() {
    SevenTVWebsocket = new WebSocket(`wss://events.7tv.io/v3@emote_set.update<object_id=${SevenTVemoteSetId}>`);

    SevenTVWebsocket.onopen = async () => {
        console.log(FgBlue + 'SevenTV ' + FgWhite + 'WebSocket connection opened.');
    };

    SevenTVWebsocket.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message && message.d && message.d.body) {
                const body = message.d.body;

                let tableData = {
                    name: 'none',
                    url: `4x.avif`,
                    flags: 0,
                    site: '',
                    action: 'other'
                };

                if (body["pushed"]) {
                    if (!body.pushed[0]) { return; }

                    const owner = body.pushed[0].value.data?.owner;

                    const creator = owner && Object.keys(owner).length > 0
                        ? owner.display_name || owner.username || "UNKNOWN"
                        : "NONE";

                    tableData = {
                        name: body.pushed[0].value.name,
                        url: `https://cdn.7tv.app/emote/${body.pushed[0]["value"].id}/4x.avif`,
                        flags: body.pushed[0].value.data?.flags,
                        original_name: body.pushed[0].value.data?.name,
                        creator,
                        site: '7TV',
                        user: body.actor["display_name"],
                        action: 'add'
                    };
                } else if (body["pulled"]) {
                    if (!body.pulled[0]) { return; }
                    tableData = {
                        name: body.pulled[0]["old_value"].name,
                        url: `https://cdn.7tv.app/emote/${body.pulled[0]["old_value"].id}/4x.avif`,
                        user: body.actor["display_name"],
                        action: 'remove'
                    };
                } else if (body["updated"]) {
                    if (!body.updated[0]) { return; }

                    tableData = {
                        newName: body.updated[0]["value"].name,
                        oldName: body.updated[0]["old_value"].name,
                        user: body.actor["display_name"],
                        site: '7TV',
                        action: 'update'
                    };
                }

                update7TVEmoteSet(tableData)
            }
        } catch (error) {
            console.log('Error parsing message:', error);
        }
    };

    SevenTVWebsocket.onerror = async (error) => {
        console.log(FgBlue + 'SevenTV ' + FgWhite + 'WebSocket error:', error);
    };

    SevenTVWebsocket.onclose = async () => {
        console.log(FgBlue + 'SevenTV ' + FgWhite + 'WebSocket connection closed.');
        detect7TVEmoteSetChange();
    };
}

async function update7TVEmoteSet(table) {
    if (table.url === '4x.avif') { return; }

    if (table.action === 'add') {
        delete table.action;
        SevenTVEmoteData.push(table);

        console.log(FgBlue + `${table.user} ADDED ${table.name}` + FgWhite);
    } else if (table.action === 'remove') {
        let foundEmote = SevenTVEmoteData.find(emote => emote.url === table.url);
        console.log(FgBlue + `${table.user} REMOVED ${foundEmote.name}` + FgWhite);

        SevenTVEmoteData = SevenTVEmoteData.filter(emote => emote.url !== table.url);
    } else if (table.action === 'update') {
        let foundEmote = SevenTVEmoteData.find(emote => emote.name === table.oldName);
        foundEmote.name = table.newName
        //SevenTVEmoteData.push(table);

        console.log(FgBlue + `${table.user} RENAMED ${table.oldName} TO ${table.newName}` + FgWhite);

        //SevenTVEmoteData = SevenTVEmoteData.filter(emote => emote.name !== table.oldName);
    }

    await updateAllEmoteData();
}