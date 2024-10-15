async function fetchFFZGlobalEmotes() {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/set/global`);
        if (!response.ok) {
            throw new Error(`Failed to fetch FFZ global emotes`);
        }
        const data = await response.json();

        FFZGlobalEmoteData = data.sets[data.default_sets[0]].emoticons.map(emote => {
            const owner = emote.owner;

            const creator = owner && Object.keys(owner).length > 0
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

async function fetchFFZEmotes() {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${channelTwitchID}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch FFZ global emotes`);
        }
        const data = await response.json();

        FFZEmoteData = data.sets[data.room.set].emoticons.map(emote => {
            const owner = emote.owner;

            const creator = owner && Object.keys(owner).length > 0
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

        console.log(FgGreen + 'Success in getting Channel FrankerFaceZ emotes!' + FgWhite);
    } catch (error) {
        console.error('Error fetching FFZ user emotes:', error);
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