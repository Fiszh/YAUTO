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
                });
            }
        }

        if (body.object.kind === "PAINT") {
            const object = body.object

            if (!object.user) {
                const data = object.data

                const foundPaint = cosmetics.paints.find(paint =>
                    paint &&
                    paint.id === (data && data.id === "00000000000000000000000000" ? data.ref_id : data.id)
                );

                if (foundPaint) { return; }

                const randomColor = getRandomTwitchColor();

                let push = {};

                if (data.stops.length) {
                    const normalizedColors = data.stops.map((stop) => ({
                        at: stop.at * 100,
                        color: stop.color
                    }));

                    const gradient = normalizedColors.map(stop =>
                        `${argbToRgba(stop.color)} ${stop.at}%`
                    ).join(', ');

                    if (data.repeat) {
                        data.function = `repeating-${data.function}`;
                    }

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

                if (data.shadows.length) {
                    const shadows = data.shadows;

                    shadow = await shadows.map(shadow => {
                        let rgbaColor = argbToRgba(shadow.color);

                        rgbaColor = rgbaColor.replace(/rgba\((\d+), (\d+), (\d+), (\d+(\.\d+)?)\)/, `rgba($1, $2, $3)`);

                        return `drop-shadow(${rgbaColor} ${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px)`;
                    }).join(' ');

                    push["shadows"] = shadow
                }

                cosmetics.paints.push(push);
            }
        } else if (body.object?.name === "Personal Emotes" || body.object?.name === "Personal Emotes Set" || body.object?.user || body.object?.id === "00000000000000000000000000" || (body.object?.flags && (body.object.flags === 11 || body.object.flags === 4))) {
            if (body.object?.id === "00000000000000000000000000" && body.object?.ref_id) {
                body.object.id = body.object.ref_id;
            }

            createCosmetic7TVProfile(body);
        } else if (body?.object?.kind == "BADGE") {
            const object = body.object
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
            });
        } else {
            console.log("Didn't process", body);
        }
    } else {
        if (body.id || body.object.ref_id) {
            const userId = body.id === "00000000000000000000000000" ? body.object.ref_id || "default_id" : body.id;

            if (userId) {
                const foundUser = cosmetics.user_info.find(user => user["personal_set_id"].includes(userId));

                if (foundUser && body["pushed"]) {
                    try {
                        const mappedEmotes = await mapPersonalEmotes(body);

                        foundUser["personal_emotes"] = foundUser["personal_emotes"] || [];
                        foundUser["personal_emotes"] = foundUser["personal_emotes"].filter(emote => emote.set_id != body.id);
                        foundUser["personal_emotes"].push(...mappedEmotes);

                        if (foundUser["ttv_user_id"]) {
                            const foundTwitchUser = TTVUsersData.find(user => user.userId === foundUser["ttv_user_id"]);

                            if (foundTwitchUser && foundTwitchUser.cosmetics) {
                                foundTwitchUser.cosmetics["personal_emotes"] = foundTwitchUser.cosmetics["personal_emotes"] || foundUser["personal_emotes"];
                            }
                        }
                    } catch (error) {
                        console.error("Error mapping personal emotes:", error);
                    }
                }
            }
        }
    }
}

async function createCosmetic7TVProfile(body) {
    if ((!body.object.owner || !body.object.owner.id) && !body.object.user.id) {
        return;
    }

    const owner = body.object.owner || body.object.user;

    let infoTable = {
        lastUpdate: Date.now(),
        user_id: owner.id,
        ttv_user_id: null,
        paint_id: null,
        badge_id: null,
        avatar_url: null,
        personal_emotes: [],
        personal_set_id: [],
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

    if (body.object.flags === 4 || body.object.flags === 11) {
        infoTable["personal_set_id"].push(String(body.object.id));
    }

    if (cosmetics && Array.isArray(cosmetics.user_info)) {
        const foundUser = cosmetics.user_info.find(user => user["user_id"] === owner.id);

        if (foundUser) {
            infoTable["personal_emotes"] = [
                ...foundUser.personal_emotes,
                ...infoTable.personal_emotes.filter(emote =>
                    !foundUser.personal_emotes.some(existingEmote => existingEmote.url === emote.url)
                ),
            ];
            Object.assign(foundUser, infoTable);
        } else {
            cosmetics.user_info.push(infoTable);
        }
    }

    if (infoTable["ttv_user_id"] && Array.isArray(TTVUsersData)) {
        const foundTwitchUser = TTVUsersData.find(user => user.userId === infoTable["ttv_user_id"]);

        if (foundTwitchUser) {
            if (!foundTwitchUser.cosmetics) {
                foundTwitchUser.cosmetics = {};
            }

            if (!foundTwitchUser.cosmetics.personal_emotes) {
                foundTwitchUser.cosmetics.personal_emotes = [];
            }

            foundTwitchUser.cosmetics.personal_emotes = [
                ...foundTwitchUser.cosmetics.personal_emotes,
                ...infoTable.personal_emotes.filter(emote =>
                    !foundTwitchUser.cosmetics.personal_emotes.some(existingEmote => existingEmote.url === emote.url)
                ),
            ];

            Object.assign(foundTwitchUser.cosmetics, infoTable);
        }
    }
}

async function mapPersonalEmotes(body) {
    return body.pushed.map(emoteData => {
        if (!emoteData) { return; };

        let emote = emoteData.value;

        if (!emoteData["value"]) {
            emote = emoteData;
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
            width: emote4x?.width,
            set_id: body.id
        };
    });
}

async function displayCosmeticPaint(user_id, color, textElement) {
    const foundUser = cosmetics.user_info.find(user => user["ttv_user_id"] === user_id);
    const randomColor = getRandomTwitchColor();

    color = color || randomColor || 'white';

    const can_display_paints = getSetting("paints");
    const fontStroke = getSetting("fontStroke");

    if (foundUser && foundUser["paint_id"]) {
        const foundPaint = cosmetics.paints.find(paint => paint.id === foundUser["paint_id"]);

        if (foundPaint && can_display_paints) {
            let style = `background-image: ${foundPaint.backgroundImage};`

            if (getSetting("paintShadows")) {
                style += ` filter: ${foundPaint.shadows};`;
            } else if (fontStroke) {
                style += ` -webkit-text-stroke: 1px black;`;
            }

            textElement.classList.add('paint');

            textElement.style.cssText = style;
            textElement.style.backgroundColor = color;
        }
        textElement.style.color = color;
    }
}

async function getPaintName(user_id) {
    const foundUser = cosmetics.user_info.find(user => user["ttv_user_id"] === user_id);

    if (foundUser && foundUser["paint_id"]) {
        const foundPaint = cosmetics.paints.find(paint => paint.id === foundUser["paint_id"]);

        if (foundPaint) {
            return foundPaint.name
        } else {
            return null
        }
    }

    return null
}