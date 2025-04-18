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

            const creator = owner && Object.keys(owner).length
                ? owner.display_name || owner.username || "UNKNOWN"
                : "NONE";

            const emote4x = emote.data.host.files.find(file => file.name === "4x.avif") 
                || emote.data.host.files.find(file => file.name === "3x.avif") 
                || emote.data.host.files.find(file => file.name === "2x.avif") 
                || emote.data.host.files.find(file => file.name === "1x.avif");
            
            return {
                name: emote.name,
                url: `https://cdn.7tv.app/emote/${emote.id}/${emote4x?.name || "1x.avif"}`,
                flags: emote.data?.flags,
                original_name: emote.data?.name,
                creator,
                emote_link: `https://7tv.app/emotes/${emote.id}`,
                site: emoteSet === 'global' ? 'Global 7TV' : '7TV',
                height: emote4x?.height,
                width: emote4x?.width
            };
        });
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// WEBSOCKET

async function detect7TVEmoteSetChange() {
    SevenTVWebsocket = new WebSocket('wss://events.7tv.io/v3');

    SevenTVWebsocket.onopen = async () => {
        let waitStartTime = Date.now();

        console.log(FgBlue + 'SevenTV ' + FgWhite + 'WebSocket connection opened.');

        waitStartTime = Date.now();

        while (channelTwitchID === "0" && Date.now() - waitStartTime < timeout) {
            console.log(FgYellow + 'Waiting for channelTwitchID to be set...' + FgWhite);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const subscribeEntitlementCreateMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: 'entitlement.create',
                condition: { platform: 'TWITCH', ctx: 'channel', id: channelTwitchID }
            }
        }

        if (channelTwitchID !== "0") {
            await SevenTVWebsocket.send(JSON.stringify(subscribeEntitlementCreateMessage));

            console.log(FgBlue + 'SevenTV ' + FgWhite + 'Subscribed to entitlement.create');
        }

        waitStartTime = Date.now();

        while ((SevenTVID === "0" || SevenTVemoteSetId === "0") && Date.now() - waitStartTime < timeout) {
            console.log(FgYellow + 'Waiting for SevenTVID or SevenTVemoteSetId to be set...' + FgWhite);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const subscribeEmoteMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: 'user.*',
                condition: {
                    object_id: SevenTVID,
                }
            }
        };

        if (SevenTVID !== "0") {
            await SevenTVWebsocket.send(JSON.stringify(subscribeEmoteMessage));

            console.log(FgBlue + 'SevenTV ' + FgWhite + 'Subscribed to user.*');
        }

        const subscribeEmoteSetMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: `emote_set.update`,
                condition: {
                    object_id: SevenTVemoteSetId,
                }
            }
        };


        if (SevenTVemoteSetId !== "0") {
            await SevenTVWebsocket.send(JSON.stringify(subscribeEmoteSetMessage));

            console.log(FgBlue + 'SevenTV ' + FgWhite + 'Subscribed to emote_set.update');
        }

        console.log(FgBlue + 'SevenTV ' + FgWhite + 'Subscribed to all of the events.');
    };

    SevenTVWebsocket.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message && message.d && message.d.body) {
                const body = message.d.body;
                let canProceed = false;

                if (message.d.type === "cosmetic.create" || !message.d.body["actor"]) {
                    updateCosmetics(body);
                    return;
                }

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

                    const creator = owner && Object.keys(owner).length
                        ? owner.display_name || owner.username || "UNKNOWN"
                        : "NONE";

                    tableData = {
                        name: body.pushed[0].value.name,
                        url: `https://cdn.7tv.app/emote/${body.pushed[0]["value"].id}/4x.avif`,
                        flags: body.pushed[0].value.data?.flags,
                        original_name: body.pushed[0].value.data?.name,
                        creator,
                        site: '7TV',
                        user: body.actor["display_name"] || "UNKNOWN",
                        action: 'add'
                    };

                    canProceed = true;
                } else if (body["pulled"]) {
                    if (!body.pulled[0]) { return; }
                    tableData = {
                        name: body.pulled[0]["old_value"].name,
                        url: `https://cdn.7tv.app/emote/${body.pulled[0]["old_value"].id}/4x.avif`,
                        user: body.actor["display_name"] || "UNKNOWN",
                        action: 'remove'
                    };

                    canProceed = true;
                } else if (body["updated"]) {
                    if (!body.updated[0]) { return; }

                    if (body["updated"][0]["key"] === 'connections') {
                        tableData = "emote_set.change"

                        tableData = {
                            newSetName: body.updated[0]["value"][0]["value"].name,
                            newSetId: body.updated[0]["value"][0]["value"].id,
                            oldSetName: body.updated[0]["value"][0]["old_value"].name,
                            oldSetId: body.updated[0]["value"][0]["old_value"].id,
                            user: body.actor["display_name"] || "UNKNOWN",
                            site: '7TV',
                            action: 'emote_set.change'
                        };

                        canProceed = true;
                    } else {
                        if (!body.updated[0]["value"] || !body.updated[0]["old_value"]) { return; }
                        
                        tableData = {
                            newName: body.updated[0]["value"].name,
                            oldName: body.updated[0]["old_value"].name,
                            user: body.actor["display_name"] || "UNKNOWN",
                            site: '7TV',
                            action: 'update'
                        };

                        canProceed = true;
                    }
                }

                if (canProceed) {
                    update7TVEmoteSet(tableData)
                }
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

        console.log(FgBlue + 'SevenTV ' + FgWhite + `${table.user} added ${table.name}`);
    } else if (table.action === 'remove') {
        let foundEmote = SevenTVEmoteData.find(emote => emote.original_name === table.name);

        console.log(FgBlue + 'SevenTV ' + FgWhite + `${table.user} removed ${foundEmote.name}`);

        SevenTVEmoteData = SevenTVEmoteData.filter(emote => emote.url !== table.url);
    } else if (table.action === 'update') {
        if (!table.newName || !table.newName) { return; }
        
        let foundEmote = SevenTVEmoteData.find(emote => emote.name === table.oldName);
        foundEmote.name = table.newName
        //SevenTVEmoteData.push(table);

        console.log(FgBlue + 'SevenTV ' + FgWhite + `${table.user} renamed ${table.oldName} to ${table.newName}`);

        //SevenTVEmoteData = SevenTVEmoteData.filter(emote => emote.name !== table.oldName);
    } else if (table.action === 'emote_set.change') {
        const unsubscribeEmoteSetMessage = {
            op: 36,
            t: Date.now(),
            d: {
                type: `emote_set.update`,
                condition: {
                    object_id: SevenTVemoteSetId,
                }
            }
        };

        await SevenTVWebsocket.send(JSON.stringify(unsubscribeEmoteSetMessage));

        console.log(FgBlue + 'SevenTV ' + FgWhite + 'UnSubscribed to emote_set.update');

        SevenTVemoteSetId = table.newSetId

        SevenTVEmoteData = await fetch7TVEmoteData(SevenTVemoteSetId);

        console.log(FgBlue + 'SevenTV ' + FgWhite + `Emote set changed to ${table["newSetName"]}`)

        const subscribeEmoteSetMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: `emote_set.update`,
                condition: {
                    object_id: SevenTVemoteSetId,
                }
            }
        };

        await SevenTVWebsocket.send(JSON.stringify(subscribeEmoteSetMessage));

        console.log(FgBlue + 'SevenTV ' + FgWhite + 'Subscribed to emote_set.update');

        //WEBSOCKET
        //await SevenTVWebsocket.close();
    }

    await updateAllEmoteData();
}

function argbToRgba(color) {
    if (color < 0) {
        color = color >>> 0;
    }

    const red = (color >> 24) & 0xFF;
    const green = (color >> 16) & 0xFF;
    const blue = (color >> 8) & 0xFF;
    return `rgba(${red}, ${green}, ${blue}, 1)`;
}