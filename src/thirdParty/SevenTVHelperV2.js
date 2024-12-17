async function pushStyle(object) {
    if (!object) { return; }

    if (object["badge"] && Object.keys(object["badge"]).length > 0) {
        const data = object["badge"]

        const foundBadge = cosmetics.badges.find(badge => badge.id === data.id);

        if (!foundBadge) {
            cosmetics.badges.push({
                id: data.id,
                title: data.tooltip,
                url: `https://cdn.7tv.app/badge/${data.id}/4x.webp`
            })
        }
    }

    if (object["paint"] && Object.keys(object["paint"]).length > 0) {
        const data = object["paint"]

        const foundPaint = cosmetics.paints.find(paint => paint.id === data.id)

        let push;

        if (!foundPaint) {
            push = {};

            const randomColor = getRandomTwitchColor()

            if (data.stops.length > 0) {
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
                    id: data.id,
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
                    id: data.id,
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
        }

        if (push) {
            cosmetics.paints.push(push)
        }
    }
}

async function pushCosmeticUserUsingGQL(cosmetic_id) {
    const response = await fetch('https://7tv.io/v3/gql', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "query": "query GetUserForUserPage($id: ObjectID!) { user(id: $id) { id username display_name avatar_url emote_sets { id flags capacity emotes { id name data { name host { files { name height width } } owner { username display_name } } } } style { color paint { id kind name function color angle shape image_url repeat stops { at color } shadows { x_offset y_offset radius color } } badge { id kind name tooltip tag } } connections { id platform } } }",
            "variables": {
                "id": `${cosmetic_id}`
            }
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let data = await response.json();

    if (data && data["data"]) {
        data = data["data"]
    }

    if (!data || !data["user"] || data["user"].length < 1) { return; }

    let user_id = null
    const userData = data["user"]

    const twitchConnection = userData.connections.find(connection => connection.platform === "TWITCH");

    if (twitchConnection && twitchConnection["id"]) {
        user_id = String(twitchConnection["id"])
    }

    const userStyle = userData["style"]

    if (userStyle && Object.keys(userStyle).length > 0) {
        pushStyle(userStyle)
    }

    let infoTable = {
        "lastUpdate": Date.now(),
        "user_id": cosmetic_id,
        "ttv_user_id": user_id,
        "paint_id": null,
        "badge_id": null,
        "avatar_url": null,
        "personal_emotes": [],
        "personal_set_id": [],
    }

    if (userStyle && Object.keys(userStyle).length > 0) {
        if (userStyle["paint"]) {
            infoTable.paint_id = userStyle["paint"]["id"]
        }

        if (userStyle["badge"]) {
            infoTable.badge_id = userStyle["badge"]["id"]
        }
    }

    if (userData.avatar_url) {
        infoTable.avatar_url = userData.avatar_url
    }

    if (userData["emote_sets"] && userData["emote_sets"].length > 0) {
        for (let set of userData["emote_sets"]) {
            if (set && set["flags"] && (set["flags"] === 4 || set["flags"] === 11)) {
                infoTable["personal_set_id"].push(set["id"])

                if (set["emotes"] && set["emotes"].length > 0) {
                    const emotes = await mapPersonalEmotes(set["emotes"]);
                    infoTable["personal_emotes"].push(...emotes);
                }
            }
        }
    }

    if (cosmetics && cosmetics["user_info"]) {
        const foundUser = cosmetics.user_info.find(user => user["user_id"] === cosmetic_id);

        if (foundUser) {
            Object.assign(foundUser, infoTable);
        } else {
            cosmetics.user_info.push(infoTable)
        }
    }

    if (user_id && TTVUsersData) {
        const foundTwitchUser = TTVUsersData.find(user => user.userId === user_id);

        if (foundTwitchUser) {
            foundTwitchUser.cosmetics = infoTable
        } else {
            return infoTable
        }
    }
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