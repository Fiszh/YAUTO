async function fetchBTTVGlobalEmoteData() {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/emotes/global`);
        if (!response.ok) {
            throw new Error(`Failed to fetch emote data for set bttv`);
        }
        const data = await response.json();
        BTTVGlobalEmoteData = data.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            original_name: emote?.codeOriginal,
            creator: null,
            site: 'Global BTTV',
            flags: BTTVZeroWidth.includes(emote.code) ? 256 : undefined
        }));
        console.log(FgRed + 'Success in getting Global BetterTTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// Also for getChannelEmotesViaTwitchID function
async function fetchBTTVEmoteData(channelID = channelTwitchID) {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelID}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch emote data for set BTTV`);
        }
        const data = await response.json();

        // Can't it be just a single set?

        const sharedEmotesData = data.sharedEmotes.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            original_name: emote?.codeOriginal,
            creator: emote.user ? emote.user.name : null,
            site: 'BTTV'
        }));

        const channelEmotesData = data.channelEmotes.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            original_name: emote?.codeOriginal,
            creator: emote.user ? (emote.user.name || broadcaster) : null,
            site: 'BTTV'
        }));

        BTTVEmoteData[channelID] = [...sharedEmotesData, ...channelEmotesData];

        console.log(FgRed + 'Success in getting Channel BetterTTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching emote data:', error);
        BTTVEmoteData[channelID] = [];
        throw error;
    }
}

async function fetchBTTVBadgeData() {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/badges/twitch`);
        if (!response.ok) {
            throw new Error(`Failed to fetch BTTV badge data`);
        }
        BTTVBadgeData = await response.json();

        console.log(FgRed + 'Success in getting Channel BetterTTV Badges!' + FgWhite);
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// WEBSOCKET

async function detectBTTVEmoteSetChange() {
    BTTVWebsocket = new WebSocket(`wss://sockets.betterttv.net/ws`);

    BTTVWebsocket.onopen = async () => {
        console.log(FgRed + 'BetterTwitchTV ' + FgWhite + 'WebSocket connection opened.');

        const message = {
            name: 'join_channel',
            data: {
                name: `twitch:${channelTwitchID}`
            }
        };

        BTTVWebsocket.send(JSON.stringify(message));
    };

    BTTVWebsocket.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message && message.name && message.data) {
                const messageType = message.name;
                const messageData = message.data;
                let userName;

                if (messageData.channel) {
                    userName = 'none'; //await getUsernameFromUserId(messageData.channel.split(':')[1])
                }

                let tableData = {
                    name: 'none',
                    url: `4x.avif`,
                    flags: 0,
                    site: '',
                    action: 'other'
                };

                if (messageType === 'emote_create') {
                    if (!messageData.emote) { return; };
                    const emoteData = messageData.emote;

                    tableData = {
                        name: emoteData.code,
                        url: `https://cdn.betterttv.net/emote/${emoteData.id}/3x`,
                        flags: 0,
                        user: userName,
                        site: 'BTTV',
                        action: 'add'
                    };
                } else if (messageType === 'emote_delete') {
                    const emoteFound = await BTTVEmoteData.find(emote => emote.url === `https://cdn.betterttv.net/emote/${messageData.emoteId}/3x`);

                    let emoteName = '';
                    if (emoteFound) {
                        emoteName = emoteFound.name
                    }

                    tableData = {
                        name: emoteName,
                        url: `https://cdn.betterttv.net/emote/${messageData.id}/3x`,
                        flags: 0,
                        user: userName,
                        site: 'BTTV',
                        action: 'remove'
                    };
                } else if (messageType === 'emote_update') {
                    if (!messageData.emote) { return; };
                    const emoteData = messageData.emote

                    tableData = {
                        name: emoteData.code,
                        url: `https://cdn.betterttv.net/emote/${emoteData.id}/3x`,
                        flags: 0,
                        user: userName,
                        site: 'BTTV',
                        action: 'update'
                    };
                }

                updateBTTVEmoteSet(tableData);
            }
        } catch (error) {
            console.log('Error parsing message:', error);
        }
    };

    BTTVWebsocket.onerror = async (error) => {
        console.log(FgRed + 'BetterTwitchTV ' + FgWhite + 'WebSocket error:', error);
    };

    BTTVWebsocket.onclose = async () => {
        console.log(FgRed + 'BetterTwitchTV ' + FgWhite + 'WebSocket connection closed.');
        detectBTTVEmoteSetChange();
    };
}

async function updateBTTVEmoteSet(table) {
    if (table.url === '4x.avif') { return; };

    if (table.action === 'add') {
        BTTVEmoteData[channelTwitchID].push({
            name: table.name,
            url: table.url,
            flags: table.flags,
            site: table.site
        });

        console.log(FgRed + "BTTV" + FgWhite + `${table.user} added ${table.name}`);
    } else if (table.action === 'remove') {
        if (table.name !== '') {
            BTTVEmoteData[channelTwitchID] = BTTVEmoteData[channelTwitchID].filter(emote => emote.name !== table.name);

            console.log(FgRed + "BTTV" + FgWhite + `${table.user} removed ${table.name}`);
        } else {
            console.log(FgRed + "BTTV" + FgWhite + `Emote was removed but we are unable to find it due to the BTTV API not providing the name of the emote.`);
        }
    } else if (table.action === 'update') {
        const foundEmote = BTTVEmoteData.find(emote => emote.url === table.url);

        if (!foundEmote) {
            BTTVEmoteData[channelTwitchID].push({
                name: table.name,
                url: table.url,
                flags: table.flags,
                site: table.site
            });
        } else {
            foundEmote.name = table.newName;
        }

        console.log(FgRed + "BTTV" + FgWhite `${table.user} renamed ${emoteFound.name} to ${table.name}`);
    }

    //await updateAllEmoteData();
}