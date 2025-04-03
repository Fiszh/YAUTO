async function fetchFFZGlobalEmotes() {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/set/global`);
        if (!response.ok) {
            throw new Error(`Failed to fetch FFZ global emotes`);
        }
        const data = await response.json();

        FFZGlobalEmoteData = data.sets[data.default_sets[0]].emoticons.map(emote => {
            const owner = emote.owner;

            const creator = owner && Object.keys(owner).length
                ? owner.display_name || owner.name || "UNKNOWN"
                : "NONE";


            return {
                name: emote.name,
                url: emote.animated ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4` : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
                emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
                creator,
                site: 'Global FFZ'
            };
        });

        console.log(FgGreen + 'Success in getting Global FrankerFaceZ emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching FFZ global emotes:', toString(error));
        throw error;
    }
}

async function fetchFFZUserData() {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${channelTwitchID}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch FFZ channel data`);
        }

        const data = await response.json();

        FFZEmoteData = data.sets[data.room.set].emoticons.map(emote => {
            const owner = emote.owner;

            const creator = owner && Object.keys(owner).length
                ? owner.display_name || owner.name || "UNKNOWN"
                : "NONE";


            return {
                name: emote.name,
                url: emote.animated ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4` : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
                emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
                creator,
                site: 'FFZ'
            };
        });

        // BADGES 

        if (data.room) {
            if (data.room["vip_badge"] && Object.keys(data.room["vip_badge"]).length) {
                const maxKey = Math.max(...Object.keys(data.room["vip_badge"]).map(Number));
                const maxUrl = data.room["vip_badge"][maxKey.toString()];

                FFZUserBadgeData['vip_badge'] = maxUrl
            }
            if (data.room["mod_urls"] && Object.keys(data.room["mod_urls"]).length) {
                const maxKey = Math.max(...Object.keys(data.room["mod_urls"]).map(Number));
                const maxUrl = data.room["mod_urls"][maxKey.toString()];

                FFZUserBadgeData['mod_badge'] = maxUrl
            }
            if (data.room["user_badge_ids"] && Object.keys(data.room["user_badge_ids"]).length) {
                const transformedBadges = {};
        
                Object.entries(data.room["user_badge_ids"]).forEach(([badge, users]) => {
                    users.forEach(user => {
                        transformedBadges[user] = badge;
                    });
                });
        
                FFZUserBadgeData['user_badges'] = transformedBadges;
            }
        }

        console.log(FgGreen + 'Success in getting Channel FrankerFaceZ data!' + FgWhite);
    } catch (error) {
        console.error('Error fetching FFZ channel data:', error);
        throw error;
    }
}

async function getFFZBadges() {
    const response = await fetch(`https://api.frankerfacez.com/v1/badges`, {
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    data.badges.forEach(badge => {
        data.users[badge.id].forEach(username => {
            FFZBadgeData.push({
                id: badge.title.replace(' ', '_').toLowerCase(),
                url: badge.urls["4"],
                title: badge.title,
                color: badge.color,
                owner_username: username
            })
        });
    });
}