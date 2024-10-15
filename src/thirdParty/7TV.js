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
        //console.error('Error fetching user ID:', error);
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