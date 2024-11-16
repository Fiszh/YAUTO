const cosmetics = {
    paints: [],
    badges: [],
    user_info: []
}

async function updateCosmetics(body) {
    if (!body) { return; }

    if (body.object) {
        if (body.object.kind === "BADGE") {
            const object = body.object

            if (!object.user) {
                const data = object.data

                const foundBadge = cosmetics.badges.find(badge =>
                    badge &&
                    badge.id === (data && data.id === "00000000000000000000000000" ? data.ref_id : data.id)
                );

                if (foundBadge) { return; }

                cosmetics.badges.push({
                    id: data.id === "00000000000000000000000000" ? data.ref_id || "default_id" : data.id,
                    title: data.tooltip,
                    url: `${data.host.url}/${data.host.files[data.host.files.length - 1].name}`
                })
            }
        } else if (body.object.kind === "PAINT") {
            const object = body.object

            if (!object.user) {
                const data = object.data

                const foundPaint = cosmetics.paints.find(paint =>
                    paint &&
                    paint.id === (data && data.id === "00000000000000000000000000" ? data.ref_id : data.id)
                );

                if (foundPaint) { return; }

                const randomColor = getRandomTwitchColor()

                let push = {};

                if (data.stops.length > 0) {
                    const colors = data.stops.map(stop => ({
                        at: stop.at,
                        color: stop.color
                    }));

                    const normalizedColors = colors.map((stop, index) => ({
                        at: (100 / (colors.length - 1)) * index,
                        color: stop.color
                    }));

                    const gradient = normalizedColors.map(stop =>
                        `${argbToRgba(stop.color)} ${stop.at}%`
                    ).join(', ');

                    data.function = data.function.toLowerCase().replace('_', '-')

                    let isDeg_or_Shape = `${data.angle}deg`

                    if (data.function !== "linear-gradient" && data.function !== "repeating-linear-gradient") {
                        isDeg_or_Shape = data.shape
                    }

                    push = {
                        id: data.id === "00000000000000000000000000" ? data.ref_id || "default_id" : data.id,
                        name: data.name,
                        style: data.function,
                        shape: data.shape,
                        backgroundImage: `${data.function || "linear-gradient"}(${isDeg_or_Shape}, ${gradient})` || `${data.style || "linear-gradient"}(${data.shape || ""} 0deg, ${randomColor}, ${randomColor})`,
                        shadows: null,
                        KIND: 'non-animated',
                        url: data.image_url
                    }
                } else {
                    push = {
                        id: data.id === "00000000000000000000000000" ? data.ref_id || "default_id" : data.id,
                        name: data.name,
                        style: data.function,
                        shape: data.shape,
                        backgroundImage: `url('${[data.image_url]}')` || `${data.style || "linear-gradient"}(${data.shape || ""} 0deg, ${randomColor}, ${randomColor})`,
                        shadows: null,
                        KIND: 'animated',
                        url: data.image_url
                    }
                }

                // SHADOWS
                let shadow = null;

                if (data.shadows.length > 0) {
                    const shadows = data.shadows;

                    shadow = await shadows.map(shadow => {
                        let rgbaColor = argbToRgba(shadow.color);

                        rgbaColor = rgbaColor.replace(/rgba\((\d+), (\d+), (\d+), (\d+(\.\d+)?)\)/, `rgba($1, $2, $3)`);

                        return `drop-shadow(${rgbaColor} ${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px)`;
                    }).join(' ');

                    push["shadows"] = shadow
                }

                cosmetics.paints.push(push)
            }
        } else if (body.object.name == "Personal Emotes" || body.object.user || body.object.id === "00000000000000000000000000") {
            if (body.object.id === "00000000000000000000000000" && body.object.ref_id) {
                body.object.id = body.object.ref_id
            }

            createCosmetic7TVProfile(body)
        }
    } else {
        if (body.id || body.object.ref_id) {
            const userId = body.id === "00000000000000000000000000" ? body.object.ref_id || "default_id" : body.id;
        
            if (userId) {
                const foundUser = cosmetics.user_info.find(user => user["personal_set_id"] === userId);
        
                if (foundUser && body["pushed"]) {
                    const mappedEmotes = await mapPersonalEmotes(body.pushed);
        
                    // AVOID DUPLICATION
                    const uniqueEmotes = mappedEmotes.filter(emote =>
                        !foundUser.personal_emotes.some(existingEmote => existingEmote.url === emote.url)
                    );
        
                    foundUser["personal_emotes"].push(...uniqueEmotes);
        
                    // UPDATE USER INFO
                    if (foundUser["ttv_user_id"]) {
                        const foundTwitchUser = TTVUsersData.find(user => user.userId === foundUser["ttv_user_id"]);
        
                        if (foundTwitchUser) {
                            if (foundTwitchUser.cosmetics) {
                                foundTwitchUser.cosmetics["personal_emotes"].push(...uniqueEmotes);
                            }
                        }
                    }
                }
            }
        }
        
    }
}

async function createCosmetic7TVProfile(body) {
    if ((!body.object.owner || !body.object.owner.id) && !body.object.user.id) { return; }

    const owner = body.object.owner || body.object.user;

    let infoTable = {
        "lastUpdate": Date.now(),
        "user_id": owner.id,
        "ttv_user_id": null,
        "paint_id": null,
        "badge_id": null,
        "avatar_url": null,
        "personal_emotes": [],
    };

    if (owner.connections) {
        const twitchConnection = owner.connections.find(connection => connection["platform"] === "TWITCH");

        if (twitchConnection) {
            infoTable["ttv_user_id"] = twitchConnection.id;
        }
    }

    if (owner.style) {
        const styleInfo = owner.style;

        if (styleInfo["paint_id"]) {
            infoTable["paint_id"] = styleInfo["paint_id"];
        }

        if (styleInfo["badge_id"]) {
            infoTable["badge_id"] = styleInfo["badge_id"];
        }
    }

    if (owner.avatar_url) {
        infoTable["avatar_url"] = owner.avatar_url;
    }

    if (body.object.flags === 4) {
        infoTable["personal_set_id"] = String(body.object.id);
    }

    // AVOID DUPLICATION
    if (cosmetics && Array.isArray(cosmetics.user_info)) {
        const foundUser = cosmetics.user_info.find(user => user["user_id"] === owner.id);

        if (foundUser) {
            if (foundUser.personal_emotes && Array.isArray(foundUser.personal_emotes)) {
                infoTable["personal_emotes"] = foundUser.personal_emotes;
            }

            Object.assign(foundUser, infoTable);
        } else {
            cosmetics.user_info.push(infoTable);
        }
    }

    // UPDATE USER INFO
    if (infoTable["ttv_user_id"]) {
        if (Array.isArray(TTVUsersData)) {
            const foundTwitchUser = TTVUsersData.find(user => user.userId === infoTable["ttv_user_id"]);

            if (foundTwitchUser) {
                if (foundTwitchUser.cosmetics) {
                    if (foundTwitchUser.cosmetics.personal_emotes && Array.isArray(foundTwitchUser.cosmetics.personal_emotes)) {
                        infoTable["personal_emotes"] = foundTwitchUser.cosmetics.personal_emotes;
                    }
                    
                    Object.assign(foundTwitchUser.cosmetics, infoTable);
                } else {
                    foundTwitchUser.cosmetics = infoTable;
                }
            }
        }
    }
}

async function mapPersonalEmotes(emotes) {
    return emotes.map(emoteData => {
        if (!emoteData) { return; }

        let emote = emoteData.value

        if (!emoteData["value"]) {
            emote = emoteData
        }

        const owner = emote.data?.owner;

        const creator = owner && Object.keys(owner).length > 0
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
            site: 'Personal Emotes',
            height: emote4x?.height,
            width: emote4x?.width
        };
    });
}

async function displayCosmeticPaint(user_id, color, textElement) {
    const foundUser = cosmetics.user_info.find(user => user["ttv_user_id"] === user_id);
    const randomColor = getRandomTwitchColor()

    if (foundUser && foundUser["paint_id"]) {
        const foundPaint = cosmetics.paints.find(paint => paint.id === foundUser["paint_id"]);

        if (foundPaint) {
            let style = `background-image: ${foundPaint.backgroundImage};`

            if (settings && (!settings.paintShadows || settings.paintShadows == "1")) {
                style += ` filter: ${foundPaint.shadows};`;
            }

            if (settings && (!settings.paints || settings.paints == "1")) {
                textElement.style.cssText = style;
            }
        }
    }

    textElement.style.backgroundColor = color || randomColor || 'white';
    textElement.classList.add('paint');
}