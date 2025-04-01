console.log("chatIndex.js hooked up!")

let client;

if (document.location.href.includes("?channel=")) {
    client = new tmi.Client({
        options: {
            debug: false,
            skipUpdatingEmotesets: true
        },
        channels: [settings.channel]
    });

    const connecting = document.createElement('div');
    connecting.classList.add('connecting-text');
    connecting.textContent = `Connecting to ${settings.channel} chat`;

    if (document.getElementById('ChatDisplay')) {
        document.getElementById('ChatDisplay').appendChild(connecting);
    }

    client.connect()

    client.on('connected', async (address, port) => {
        const connecting = document.getElementsByClassName('connecting-text');

        if (connecting) {
            connecting[0].remove();
        }

        console.log("connected!")
    });

    client.on("message", onMessage);
}

async function onMessage(channel, userstate, message, self) {
    // MOD RELOAD COMMAND

    if (userstate['badges-raw'] || String(userstate["user-id"]) === "528761326") {
        if (String(userstate["user-id"]) === "528761326" || userstate.mod || userstate['badges-raw'].includes('broadcaster/1')) {
            if (message.toLowerCase() === "!reloadoverlay") {
                window.location.reload(true);
            } else if (message.toLowerCase() === "!refreshoverlay") {
                loadChat();
            } else if (message.toLowerCase() === "!reloadwebsockets") {
                try {
                    SevenTVWebsocket.close();
                    BTTVWebsocket.close();
                } catch (err) { }
            }
        }
    }

    // TEST COMMANDS 

    if (String(userstate["user-id"]) === "528761326") {
        if (message.toLowerCase().startsWith("!adduser")) {
            if (message.split(" ")[1]) {
                pushCosmeticUserUsingGQL(message.split(" ")[1])
            }
        }
    }

    // COMMAND TO PING THE WEBSOCKET

    const validMessages = [
        "dudewhereismy7tvpaint",
        "dudewhereismy7tvbadge",
        "dudewhydoes7tvnotupdatemycosmetics",
        "dudewherearemy7tvcosmetics"
    ];

    if (validMessages.includes(message.toLowerCase()) && userstate["user-id"]) {
        user_sevenTV_id = await get7TVUserID(userstate["user-id"]);

        if (user_sevenTV_id && false) {
            try {
                const body = {
                    "kind": 1,
                    "passive": true,
                    "session_id": "",
                    "data": {
                        "platform": "TWITCH",
                        "id": channelTwitchID
                    }
                };

                fetch(`https://7tv.io/v3/users/${user_sevenTV_id}/presences`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
            } catch (err) { }
        }
    }

    // BLOCK BOTS
    const FFZBadge = FFZBadgeData.find(badge => badge.owner_username == userstate.username)

    if (FFZBadge && FFZBadge.id && FFZBadge.id == "bot") {
        if (!await getSetting("bots")) {
            return;
        }
    }

    if (FFZUserBadgeData && FFZUserBadgeData["user_badges"] && FFZUserBadgeData["user_badges"][userstate["user-id"]] && FFZUserBadgeData["user_badges"][userstate["user-id"]] === "2") {
        if (!await getSetting("bots")) {
            return;
        }
    }

    // BLOCK USERS

    if (await getSetting("userBL", { action: "includes", include: userstate.username })) {
        return;
    }

    const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

    foundUserCosmetics = cosmetics.user_info.find(user => user["ttv_user_id"] === userstate["user-id"]);

    if (!foundUser) {
        let userColor = userstate.color

        if (userstate.color === null || userstate.color === undefined || !userstate.color) {
            userColor = getRandomTwitchColor();
        }

        let user = {
            name: `@${userstate.username}`,
            color: userColor,
            cosmetics: foundUserCosmetics,
            avatar: null,
            userId: userstate["user-id"]
        };

        TTVUsersData.push(user);
    } else {
        if (foundUser.color && userstate && userstate.color) {
            foundUser.color = userstate.color
            foundUser.cosmetics = foundUserCosmetics
        }
    }

    handleMessage(userstate, message, channel);
}

let chatDisplay = document.getElementById("ChatDisplay");

//CUSTOM 
let customBadgeData = [];

let config_path = 'src/landingPage/configuration.json';
let config = {};

//CONSOLE COLORS
const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";

//TWITCH
let channelTwitchID = '0';
let TTVSubBadgeData = [];
let TTVGlobalBadgeData = [];
let TTVBitBadgeData = [];
let TTVUsersData = [];
let TTVBitsData = [];
let TTVUserRedeems = [];
let version;

const twitchColors = [
    "#0000FF", // Blue
    "#8A2BE2", // Blue Violet
    "#5F9EA0", // Cadet Blue
    "#D2691E", // Chocolate
    "#FF7F50", // Coral
    "#1E90FF", // Dodger Blue
    "#B22222", // Firebrick
    "#DAA520", // Golden Rod
    "#008000", // Green
    "#FF69B4", // Hot Pink
    "#FF4500", // Orange Red
    "#FF0000", // Red
    "#2E8B57", // Sea Green
    "#00FF7F", // Spring Green
    "#9ACD32"  // Yellow Green
];

//7TV
let SevenTVID = '0';
let SevenTVemoteSetId = '0';
let SevenTVWebsocket;

let SevenTVGlobalEmoteData = [];
let SevenTVEmoteData = [];

//FFZ
let FFZGlobalEmoteData = [];
let FFZEmoteData = [];

let FFZBadgeData = [];
let FFZUserBadgeData = [];

//BTTV
let BTTVWebsocket;
let BTTVGlobalEmoteData = [];
let BTTVEmoteData = [];

let allEmoteData = [];

const BTTVZeroWidth = ['cvHazmat', 'cvMask'];

async function trimPart(text) {
    if (text) {
        return text.trim()
    } else {
        return text
    }
}

async function getSetting(setting_name, action) {
    if (settings[setting_name]) {
        if (action) {
            if (action.action == "includes") {
                if (settings[setting_name].includes(action.include)) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        if (settings[setting_name] == "0") { return false; }

        return settings[setting_name];
    } else {
        let found_in_config = Object.keys(config).find(key => config[key].param === setting_name);

        if (!found_in_config && configuration) {
            found_in_config = Object.keys(configuration).find(key => configuration[key].param === setting_name);
        }

        if (found_in_config) {
            let sourceConfig = config[found_in_config] ? config : configuration;

            if (sourceConfig[found_in_config].value == "0") {
                return false;
            }

            return sourceConfig[found_in_config].value;
        } else {
            console.log(setting_name, "not found");
            return false;
        }

    }
}

async function handleMessage(userstate, message, channel) {
    if (!message) { return; }

    // BLOCK PREFIX

    const messagePrefix = message.charAt(0);

    if (await getSetting("prefixBL", { action: "includes", include: messagePrefix })) {
        return;
    }

    // BLOCK REDEEMS

    if (!await getSetting("redeem")) {
        if (TTVUserRedeems[userstate.username]) {
            delete TTVUserRedeems[userstate.username];
            return;
        }
    }

    // BLOCK USERS NEEDED HERE FOR PREVIEW

    if (await getSetting("userBL", { action: "includes", include: userstate.username })) {
        return;
    }

    message = String(message).trimStart();
    message = sanitizeInput(message);

    const tagsReplaced = message;
    let rendererMessage = tagsReplaced;

    let username = await trimPart(userstate.username);
    let displayname = await trimPart(userstate["display-name"]);
    let finalUsername = await trimPart(userstate.username);
    const message_id = userstate.id || "0"

    if (username && displayname) {
        if (username.toLowerCase() == displayname.toLowerCase()) {
            finalUsername = `${displayname}:`
        } else {
            finalUsername = `${username} (${displayname}):`
        }
    }

    const messageElement = document.createElement("div");
    messageElement.classList.add('message');

    messageElement.setAttribute("message_id", message_id);
    messageElement.setAttribute("sender", username);

    let messageHTML = `<div class="message-text">
                                <span class="name-wrapper" tooltip-name="${finalUsername.replace(":", "")}" tooltip-type="User" tooltip-creator="" tooltip-image="">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${rendererMessage}
                        </div>`;

    // Append the new message element
    chatDisplay.appendChild(messageElement);

    let TTVMessageEmoteData = [];

    if (userstate.emotes) {
        TTVMessageEmoteData = Object.entries(userstate.emotes).flatMap(([emoteId, positions]) =>
            positions.map(position => {
                const [start, end] = position.split('-').map(Number);

                const name = Array.from(message).slice(start, end + 1).join('');

                return {
                    name,
                    url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
                    site: 'TTV'
                };
            })
        );
    }

    let badges = [];

    // CUSTOM BADGES

    customBadgeData.forEach(custom_badge => {
        if (custom_badge.users.includes(userstate["user-id"]) || userstate["user-id"] == "185965290") {
            badges.push({
                badge_url: custom_badge.url,
                alt: custom_badge.title,
                background_color: undefined,
            });
        }
    });

    // TWITCH BADGES

    // APRIL FIRST
    // FREE STAFF BADGE
    if (settings["april"] != "0") {
        userstate['badges-raw'] = `staff/1,${userstate['badges-raw']}`
    }

    if (userstate['badges-raw'] && Object.keys(userstate['badges-raw']).length > 0) {
        let rawBadges = userstate['badges-raw'];
        let badgesSplit = rawBadges.split(',');

        for (const Badge of badgesSplit) {
            let badgeSplit = Badge.split("/");

            if (badgeSplit[0] === 'subscriber') {
                if (userstate.badges) {
                    if (userstate.badges.subscriber) {
                        const badge = TTVSubBadgeData.find(badge => badge.id === userstate.badges.subscriber);

                        if (badge) {
                            badges.push({
                                badge_url: badge.url,
                                alt: badge.title,
                                background_color: undefined
                            });

                            continue;
                        }
                    }
                }
            } else if (badgeSplit[0] === "bits") {
                if (userstate.badges.bits) {
                    const badge = TTVBitBadgeData.find(badge => badge.id === userstate.badges.bits);

                    if (badge) {
                        badges.push({
                            badge_url: badge.url,
                            alt: badge.title,
                            background_color: undefined
                        });

                        continue;
                    }

                }
            }

            const badge = TTVGlobalBadgeData.find(badge => badge.id === `${badgeSplit[0]}_${badgeSplit[1]}`);

            if (badge && badge.id) {
                if (badge.id === "moderator_1" && FFZUserBadgeData["mod_badge"]) {
                    badges.push({
                        badge_url: FFZUserBadgeData["mod_badge"],
                        alt: "Moderator",
                        background_color: "#00ad03"
                    });

                    continue;
                }

                if (badge.id === "vip_1" && FFZUserBadgeData["vip_badge"]) {
                    badges.push({
                        badge_url: FFZUserBadgeData["vip_badge"],
                        alt: "VIP",
                        background_color: "#e005b9"
                    });

                    continue;
                }
            }

            if (badge) {
                badges.push({
                    badge_url: badge.url,
                    alt: badge.title,
                    background_color: undefined
                });
            }
        }
    }

    // FFZ Badges

    const foundFFZBadges = FFZBadgeData.filter(badge => badge.owner_username == userstate.username);

    foundFFZBadges.forEach(foundFFZBadge => {
        badges.push({
            badge_url: foundFFZBadge.url,
            alt: foundFFZBadge.title,
            background_color: foundFFZBadge.color,
        });
    });

    if (FFZUserBadgeData["user_badges"] && FFZUserBadgeData["user_badges"][userstate["user-id"]]) {
        const ffz_url = `https://cdn.frankerfacez.com/badge/${FFZUserBadgeData["user_badges"][userstate["user-id"]]}/4`;

        const foundBadge = FFZBadgeData.find(badge => badge.url === ffz_url);
        const isThere = badges.find(badge => badge.badge_url === ffz_url);

        if (!isThere) {
            badges.push({
                badge_url: foundBadge.url,
                alt: foundBadge.title,
                background_color: foundBadge.color,
            });
        }
    }

    // 7tv Badges

    const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

    if (foundUser && foundUser.cosmetics && foundUser.cosmetics["badge_id"]) {
        const foundBadge = cosmetics.badges.find(Badge => Badge.id === foundUser.cosmetics["badge_id"]);

        if (foundBadge) {
            badges.push({
                badge_url: foundBadge.url,
                alt: foundBadge.title,
                background_color: undefined
            });
        }
    }

    // APRIL FIRST
    // FAKE ADMIN BADGE
    if (settings["april"] != "0") {
        badges.push({
            badge_url: "https://cdn.7tv.app/badge/01GAFAKCYG000E8VNG1S1RMTBH/4x.avif",
            alt: "7TV Admin",
            background_color: undefined
        });
    }

    badges = badges.filter((badge, index, self) =>
        index === self.findIndex(b => b.badge_url === badge.badge_url)
    );

    let badges_html = badges
        .map(badge =>
            `<span class="badge-wrapper">
                <img style="background-color: ${badge.background_color || 'transparent'};" src="${badge.badge_url}" alt="${badge.alt}" class="badge" loading="lazy">
            </span>`
        )
        .join("");

    if (!await getSetting("badges")) {
        badges_html = '';
    }

    if (await getSetting("msgCaps")) {
        finalUsername = finalUsername.toUpperCase()
    }

    if (await getSetting("msgBold")) {
        rendererMessage = `<strong>${tagsReplaced}</strong>`;
    }

    messageHTML = `<div class="message-text">
                            ${badges_html}
                                <span class="name-wrapper">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${rendererMessage}
                        </div>`;

    messageElement.innerHTML = messageHTML;

    // APRIL FIRST
    // RANDOM SIZE, FONT AND FLIPPED OVER
    if (settings["april"] != "0") {
        messageElement.style.fontSize = Math.round(Math.random() * 35 + 15) + 'px';

        let scaleX = Math.round(Math.random() + 0.7);
        let scaleY = Math.round(Math.random() + 0.7);
        let rotation = '';

        if (Math.random() < (1 / 8)) {
            rotation = 'rotate(180deg)';
        }

        messageElement.style.transform = `scaleX(${scaleX}) scaleY(${scaleY}) ${rotation}`;

        const random_fonts = [
            "Arial",
            "Times New Roman",
            "Courier New",
            "Verdana",
            "Georgia",
            "Comic Sans MS",
            "Trebuchet MS",
            "Impact",
            "Wingdings",
            "Symbol",
            "MS Sans Serif",
            "Tahoma",
            "Calibri",
            "Segoe UI",
            "Consolas",
            "Inter"
        ];

        const randomIndex = Math.floor(Math.random() * random_fonts.length);
        const random_font = random_fonts[randomIndex];
        messageElement.style.fontFamily = random_font;
    }

    fadeOut(messageElement);

    let results = await replaceWithEmotes(message, TTVMessageEmoteData, userstate);

    if (await getSetting("msgBold")) {
        results = `<strong>${results}</strong>`;
    }

    let finalMessageHTML = `<div class="message-text">
                            ${badges_html}
                                <span class="name-wrapper">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${results}
                        </div>`;

    messageElement.innerHTML = finalMessageHTML;

    var usernames = messageElement.querySelectorAll('.name-wrapper');

    if (usernames) {
        usernames.forEach(async function (element) {
            const strongElement = element.querySelector('strong');

            if (strongElement) {
                const name = `@${strongElement.innerHTML.replace(/[@,:]|\s*\(.*\)/g, '')}`.toLowerCase()

                const foundUser = TTVUsersData.find(user => user.name === name);

                if (foundUser) {
                    if (foundUser.cosmetics) {
                        await displayCosmeticPaint(foundUser.userId, foundUser.color, strongElement);
                    } else {
                        const randomColor = getRandomTwitchColor(foundUser.name.replace("@", ""));
                        strongElement.style.color = foundUser.color || randomColor;
                    }
                } else {
                    let randomColor = getRandomTwitchColor(name.replace("@", ""));

                    if (userstate && name.toLowerCase().replace("@", "") == userstate.username.toLowerCase() && userstate.color) {
                        randomColor = userstate.color
                    }

                    strongElement.style.color = randomColor;
                }
            }
        });
    }
}

async function fadeOut(element) {
    if (!await getSetting("fadeOut")) { return; }
    if (!document.location.href.includes("?channel=")) { return; }

    const fadeOutTime = await getSetting("fadeOut") * 1000

    setTimeout(() => {
        element.style.transition = 'opacity 1s ease';
        element.classList.add('fade');

        setTimeout(() => {
            element.remove();
        }, 1000);

    }, fadeOutTime || 30000);
}

async function checkPart(part, string) {
    if (!await getSetting("mentionColor")) { return; }
    if ((!part || typeof part !== "string") || (!string || typeof string !== "string")) { return false; }

    return (part.toLowerCase() === string)
}

function getRandomTwitchColor(name) {
    if (!name) {
        const randomIndex = Math.floor(Math.random() * twitchColors.length);
        return twitchColors[randomIndex];
    }

    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    hash = Math.abs(hash);

    const colorIndex = hash % twitchColors.length;

    return twitchColors[colorIndex];
}

async function updateAllEmoteData() {
    allEmoteData = [
        ...SevenTVGlobalEmoteData,
        ...SevenTVEmoteData,
        ...BTTVGlobalEmoteData,
        ...BTTVEmoteData,
        ...FFZGlobalEmoteData,
        ...FFZEmoteData,
    ];
}

function splitTextWithTwemoji(text) {
    const parsedText = twemoji.parse(text, {
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
        folder: 'svg',
        ext: '.svg'
    });

    const div = document.createElement('div');
    div.innerHTML = parsedText;

    const result = [];
    const nodes = div.childNodes;

    nodes.forEach(node => {
        if (node.nodeName === 'IMG') {
            if (node.getAttribute('src')) {
                result.push({ emoji: node.getAttribute('alt'), image: node.getAttribute('src') });
            } else {
                result.push(...node.textContent.split(" ").filter(word => word.trim() !== ""));
            }
        } else if (node.nodeType === 3) {
            result.push(...node.textContent.split(" ").filter(word => word.trim() !== ""));
        }
    });

    return result;
}

function sanitizeInput(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/(<)(?!3)/g, "&lt;")
        .replace(/(>)(?!\()/g, "&gt;");
}

async function replaceWithEmotes(inputString, TTVMessageEmoteData, userstate) {
    if (!inputString) { return inputString }
    let lastEmote = false;

    updateAllEmoteData()

    inputString = sanitizeInput(inputString);

    try {
        const ttvEmoteData = TTVMessageEmoteData

        const nonGlobalEmoteData = [
            ...SevenTVEmoteData,
            ...BTTVEmoteData,
            ...FFZEmoteData,
        ];

        const emoteData = [
            ...ttvEmoteData,
            ...nonGlobalEmoteData,
            ...allEmoteData,
        ];

        if (emoteData.length === 0) return inputString;

        let EmoteSplit = await splitTextWithTwemoji(inputString);

        let foundMessageSender = null

        if (userstate) {
            foundMessageSender = TTVUsersData.find(user => user.name === `@${userstate.username}`);
        }

        const replacedParts = [];

        for (let i = 0; i < EmoteSplit.length; i++) {
            let part = EmoteSplit[i];
            let foundEmote;
            let foundUser;
            let emoteType = '';

            // Detect emoji
            if (!foundEmote && part.emoji) {
                foundEmote = {};
                foundEmote.name = part.emoji;
                emoteType = "site";
                foundEmote.url = part.image;
                foundEmote.emote_link = part.image;
            }

            if (!foundEmote) {
                if (userstate && userstate['bits']) {
                    let match = part.match(/^([a-zA-Z]+)(\d+)$/);

                    if (match) {
                        let prefix = match[1]; // Prefix
                        let bits = match[2]; // Amount

                        let result = findEntryAndTier(prefix, bits);

                        if (result) {
                            foundEmote = {
                                name: result.name,
                                url: result.tier.url,
                                site: 'TTV',
                                color: result.tier.color,
                                bits: `<div class="bits-number">${bits}</div>`
                            };

                            emoteType = 'Bits';
                        }
                    }
                }
            }

            // Prioritize ttvEmoteData
            if (!foundEmote) {
                for (const emote of ttvEmoteData) {
                    if (emote.name && part === sanitizeInput(emote.name)) {
                        foundEmote = emote;
                        emoteType = emote.site;
                        break;
                    }
                }
            }

            // Prioritize personalEmotes
            if (!foundEmote) {
                if (foundMessageSender && foundMessageSender.cosmetics) {
                    if (foundMessageSender.cosmetics.personal_emotes && foundMessageSender.cosmetics.personal_emotes.length > 0) {
                        for (const emote of foundMessageSender.cosmetics.personal_emotes) {
                            if (emote.name && part === sanitizeInput(emote.name)) {
                                foundEmote = emote;
                                emoteType = 'Personal';
                                break;
                            }
                        }
                    }
                }
            }

            // Prioritize nonGlobalEmoteData
            if (!foundEmote) {
                for (const emote of nonGlobalEmoteData) {
                    if (emote.name && part === sanitizeInput(emote.name)) {
                        foundEmote = emote;
                        emoteType = emote.site;
                        break;
                    }
                }
            }

            // Search in allEmoteData
            if (!foundEmote) {
                for (const emote of allEmoteData) {
                    if (emote.name && part === sanitizeInput(emote.name)) {
                        foundEmote = emote;
                        emoteType = emote.site;
                        break;
                    }
                }
            }

            // Search for user if no emote is found
            if (!foundEmote) {
                for (const user of TTVUsersData) {
                    const userName = user.name.toLowerCase();
                    const checks = await Promise.all([
                        checkPart(part, userName),
                        checkPart(part, userName.slice(1)),
                        checkPart(part, `${userName},`),
                        checkPart(part, `${userName.slice(1)},`)
                    ]);

                    if (checks.some(value => value === true)) {
                        foundUser = user;
                        break;
                    }
                }
            }

            if (foundEmote) {
                let emoteHTML = '';

                if (emoteType != "Bits") {
                    for (const key in foundEmote) {
                        if (typeof foundEmote[key] === 'string') {
                            foundEmote[key] = sanitizeInput(foundEmote[key]);
                        }
                    };
                }

                let additionalInfo = '';
                if (foundEmote.original_name && foundEmote.name !== foundEmote.original_name) {
                    additionalInfo += `, Alias of: ${foundEmote.original_name}`;
                }

                let emoteStyle = `style="height: ${desiredHeight}px; position: absolute;"`;

                let { width, height } = foundEmote.width && foundEmote.height
                    ? { width: foundEmote.width, height: foundEmote.height }
                    : await getImageSize(foundEmote.url);

                // Calculate the aspect ratio if height and width are already present
                if (width && height) {
                    const aspectRatio = calculateAspectRatio(width, height, desiredHeight);
                    foundEmote.width = aspectRatio.width;
                    foundEmote.height = desiredHeight;
                } else {
                    foundEmote.height = desiredHeight;
                }

                let lastEmoteWrapper;
                let tempElement;
                if (replacedParts.length > 0) {
                    const lastHtml = replacedParts[replacedParts.length - 1];
                    tempElement = document.createElement('div');
                    tempElement.innerHTML = lastHtml;
                    lastEmoteWrapper = tempElement.querySelector('.emote-wrapper');
                }

                let willReturn = true;

                if (!lastEmoteWrapper || !lastEmote || !foundEmote.flags || foundEmote.flags !== 256) {
                    emoteHTML = `<span class="emote-wrapper" style="color:${foundEmote.color || 'white'}">
                            <div style="display: inline-flex; justify-content: center">
                                <img src="https://femboy.beauty/zN7uA" alt="ignore" class="emote" style="height: ${desiredHeight}px; width: ${foundEmote.width}px; position: relative; visibility: hidden;">
                                <img src="${foundEmote.url}" alt="${foundEmote.name}" class="emote" ${emoteStyle}>
                            </div>
                            ${foundEmote.bits || ''}
                        </span>`;
                } else if (lastEmoteWrapper && lastEmote && foundEmote.flags && foundEmote.flags === 256) {
                    willReturn = false;
                    emoteStyle = `style="height: ${desiredHeight}px; position: absolute;"`;
                    const aTag = lastEmoteWrapper.querySelector('div');
                    aTag.innerHTML += `<img src="${foundEmote.url}" alt="${foundEmote.name}" class="emote" ${emoteStyle}>`;

                    const targetImg = lastEmoteWrapper.querySelector('img[src="https://femboy.beauty/zN7uA"]');
                    if (targetImg) {
                        const targetWidth = parseInt(targetImg.style.width);
                        const foundWidth = parseInt(foundEmote.width);

                        if (targetWidth < foundWidth) {
                            targetImg.style.width = `${foundEmote.width}px`;
                        }
                    }

                    replacedParts[replacedParts.length - 1] = tempElement.innerHTML;
                }

                lastEmote = true;

                if (willReturn) {
                    replacedParts.push(emoteHTML);
                }
            } else if (foundUser) {
                lastEmote = false;

                if (await getSetting("msgCaps")) {
                    part = part.toUpperCase()
                }

                const userHTML = `<span class="name-wrapper">
                            <strong style="color: ${foundUser.color}">${part}</strong>
                        </span>`;

                replacedParts.push(userHTML);
            } else {
                lastEmote = false;

                if (await getSetting("msgCaps")) {
                    part = part.toUpperCase()
                }

                let twemojiHTML = part;

                if (part && typeof part === "string") {
                    twemojiHTML = twemoji.parse(part, {
                        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                        folder: 'svg',
                        ext: '.svg',
                        className: 'twemoji'
                    });
                }

                replacedParts.push(twemojiHTML);
            }
        }

        const resultString = replacedParts.join(' ');

        lastEmote = false;
        return resultString;
    } catch (error) {
        console.log('Error replacing words with images:', error);
        return inputString;
    }
}

function decodeEmojiToUnified(emoji) {
    return [...emoji]
        .map(char => char.codePointAt(0).toString(16).toUpperCase())
        .join('-');
}

function encodeUnifiedToEmoji(unified) {
    return String.fromCodePoint(
        ...unified.split('-').map(code => parseInt(code, 16))
    );
}

function calculateAspectRatio(width, height, desiredHeight) {
    const aspectRatio = width / height;
    const calculatedWidth = desiredHeight * aspectRatio;
    return { width: calculatedWidth, height: desiredHeight };
}

async function getImageSize(urlOrDimensions, retries = 3) {
    return new Promise((resolve, reject) => {
        if (typeof urlOrDimensions === 'object' && urlOrDimensions.width && urlOrDimensions.height) {
            const { width, height } = urlOrDimensions;
            const dimensions = calculateAspectRatio(width, height, desiredHeight);

            resolve(dimensions);
        } else if (typeof urlOrDimensions === 'string') {
            const img = document.createElement('img');
            img.style.display = 'none';

            const loadImage = (attempt) => {
                img.onload = function () {
                    const naturalWidth = this.naturalWidth;
                    const naturalHeight = this.naturalHeight;

                    const dimensions = calculateAspectRatio(naturalWidth, naturalHeight, desiredHeight);

                    img.remove();

                    resolve(dimensions);
                };

                img.onerror = function () {
                    console.error(`Error loading image: ${urlOrDimensions} (Attempt: ${attempt + 1}/${retries})`);
                    if (attempt < retries - 1) {
                        console.warn(`Retrying image load (${attempt + 1}/${retries})...`);
                        loadImage(attempt + 1);
                    } else {
                        img.remove();
                        reject(new Error(`Failed to load the image after ${retries} attempts: ${urlOrDimensions}`));
                    }
                };

                img.src = urlOrDimensions;
            };

            loadImage(0);
            document.body.appendChild(img);
        } else {
            reject(new Error("Invalid input. Expected an object with width and height or a URL string."));
        }
    });
}

function findEntryAndTier(prefix, bits) {
    prefix = prefix.toLowerCase();

    for (let entry of TTVBitsData) {
        if (entry.name.toLowerCase() !== prefix) continue;

        for (let i = 0; i < entry.tiers.length; i++) {
            let currentTier = entry.tiers[i];
            let nextTier = entry.tiers[i + 1];

            if (!nextTier && bits >= currentTier.min_bits) {
                return { name: entry.name, tier: currentTier };
            }

            if (bits >= currentTier.min_bits && bits < nextTier.min_bits) {
                return { name: entry.name, tier: currentTier };
            }
        }
    }

    return null;
}

async function getTwitchUser(arg0) {
    let url;

    if (/^\d+$/.test(arg0)) {
        url = `https://api.ivr.fi/v2/twitch/user?id=${arg0}`;
    } else {
        url = `https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(arg0)}`;
    }

    const response = await fetch(url, {
        headers: {
            accept: "application/json"
        }
    })

    if (!response.ok) {
        console.error(response)
        return
    }

    const data = await response.json()

    return data[0]
}

async function getBadges() {
    //CHANNEL
    const response = await fetch(`https://api.ivr.fi/v2/twitch/badges/channel?login=${settings.channel}`, {
        headers: {
            accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    //SUBS
    data.forEach(element => {
        if (element["set_id"] === 'subscriber') {
            if (element && Object.keys(element).length > 0) {
                TTVSubBadgeData = Object.entries(element)
                    .flatMap(([set_id, badges]) => {
                        if (set_id !== 'set_id' && Array.isArray(badges)) {
                            return badges.filter(badge => badge !== 'subscriber')
                                .map(badge => ({
                                    id: badge.id,
                                    url: badge["image_url_4x"],
                                    title: badge.title
                                }));
                        }
                        return [];
                    });
            }
        }
    });

    //BITS
    data.forEach(element => {
        if (element["set_id"] === 'bits') {
            if (element && Object.keys(element).length > 0) {
                TTVBitBadgeData = Object.entries(element)
                    .flatMap(([set_id, badges]) => {
                        if (set_id !== 'set_id' && Array.isArray(badges)) {
                            return badges.filter(badge => badge !== 'bits')
                                .map(badge => ({
                                    id: badge.id,
                                    url: badge["image_url_4x"],
                                    title: badge.title
                                }));
                        }
                        return [];
                    });
            }
        }
    });

    //GLOBAL
    const response1 = await fetch(`https://api.ivr.fi/v2/twitch/badges/global`, {
        headers: {
            accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data1 = await response1.json();

    data1.forEach(element => {
        if (element["versions"]) {
            if (element && Object.keys(element).length > 0) {
                TTVGlobalBadgeData.push(
                    ...element["versions"].map(badge => ({
                        id: element.set_id + "_" + badge.id,
                        url: badge["image_url_4x"],
                        title: badge.title
                    }))
                );
            }
            return [];
        }
    });
}

const gqlQueries = {
    url: 'https://gql.twitch.tv/gql',
    headers: {
        'Client-ID': 'ue6666qo983tsx6so1t0vnawi233wa',
        'Client-Version': version,
        'Referer': 'https://twitch.tv/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 7.1; Smart Box C1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Content-Type': 'application/json'
    }
}

async function fetchTTVGlobalBitsData() {
    try {
        const body_global = JSON.stringify({
            "query": "query BitsConfigContext_Global { cheerConfig { displayConfig { backgrounds colors { bits color } order scales types { animation extension } } groups { templateURL nodes { id prefix type campaign { id brandImageURL brandName thresholds { id minimumBits matchedPercent } minimumBitsAmount bitsTotal bitsUsed bitsPercentageRemaining userLimit self { id bitsUsed canBeSponsored } } tiers { id bits canShowInBitsCard } } } } }"
        });

        const response_global = await fetch(gqlQueries.url, {
            method: 'POST',
            headers: gqlQueries.headers,
            body: body_global
        });

        if (!response_global.ok) {
            throw new Error('Network response was not ok');
        }

        const data_global = await response_global.json();

        const displayConfig = data_global.data.cheerConfig.displayConfig.colors

        TTVBitsData = data_global.data.cheerConfig.groups[0].nodes.map(emote => ({
            name: emote.prefix,
            tiers: emote.tiers.map(tier => ({
                min_bits: tier["bits"],
                url: `https://d3aqoihi2n8ty8.cloudfront.net/actions/${emote.prefix.toLowerCase()}/dark/animated/${tier["bits"]}/4.gif`,
                emote_link: `https://d3aqoihi2n8ty8.cloudfront.net/actions/${emote.prefix.toLowerCase()}/dark/animated/${tier["bits"]}/4.gif`,
                color: displayConfig.find(color => color.bits === tier["bits"]).color
            })),
            site: 'TTV'
        }));

        console.log(FgMagenta + 'Success in getting bits emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching user ID:', error);
    }
}

async function fetchTTVBitsData() {
    try {
        const body = JSON.stringify({
            "query": `query BitsConfigContext_Channel { channel: user(login: \"${settings.channel}\") { cheer { id cheerGroups { templateURL nodes { id prefix type tiers { id bits } } } } } }`
        });

        const response = await fetch(gqlQueries.url, {
            method: 'POST',
            headers: gqlQueries.headers,
            body: body
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (!data || !data.data || !data.data.channel || !data.data.channel.cheer) {
            console.log("Channel doesn't have any custom bits emotes!")
            return
        }

        const parts = data.data.channel.cheer.cheerGroups[0].templateURL.split('/');
        const action_prefix = parts[5];

        const user_data = await getTwitchUser(settings.channel)

        const color = user_data.chatColor || getRandomTwitchColor(settings.channel)

        const channel_bit_emotes = data.data.channel.cheer.cheerGroups.map(emote => ({
            name: emote.nodes[0].prefix,
            tiers: emote.nodes[0].tiers.map(tier => ({
                min_bits: tier["bits"],
                url: `https://d3aqoihi2n8ty8.cloudfront.net/partner-actions/${channelTwitchID}/${action_prefix}/${tier["bits"]}/dark/animated/4.gif`,
                emote_link: `https://d3aqoihi2n8ty8.cloudfront.net/partner-actions/${channelTwitchID}/${action_prefix}/${tier["bits"]}/dark/animated/4.gif`,
                color: color
            })),
            site: 'TTV'
        }));

        TTVBitsData = [...TTVBitsData, ...channel_bit_emotes];

        console.log(FgMagenta + 'Success in getting bits emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching user ID:', error);
    }
}

async function loadInBits() {
    await getVersion() // IMPORTANT

    fetchTTVGlobalBitsData()
    fetchTTVBitsData()
}

async function load7TV() {
    try {
        SevenTVID = await get7TVUserID(channelTwitchID);
        await get7TVEmoteSetID(SevenTVID);
        SevenTVGlobalEmoteData = await fetch7TVEmoteData('global');

        SevenTVEmoteData = await fetch7TVEmoteData(SevenTVemoteSetId);

        // WEBSOCKET
        detect7TVEmoteSetChange();
    } catch (err) {
        console.log(err)
    }
}

async function loadBTTV() {
    try {
        fetchBTTVGlobalEmoteData();
        fetchBTTVEmoteData();

        // WEBSOCKET
        detectBTTVEmoteSetChange();
    } catch (err) {
        console.log(err)
    }
}

async function loadFFZ() {
    try {
        fetchFFZGlobalEmotes();
        fetchFFZUserData();

        getFFZBadges();
    } catch (err) {
        console.log(err)
    }
}

async function loadChat() {
    try {
        const response = await fetch(config_path);

        if (!response.ok) {
            throw new Error("Failed to load in configuration.json");
        }

        const data = await response.json();

        if (Object.keys(data).length < 1) {
            throw new Error("configuration.json was loaded but it seems to be empty");
        }

        config = data;

        config = Object.keys(data).reduce((acc, key) => {
            acc[key] = {
                value: data[key].value,
                param: data[key].param
            };
            return acc;
        }, {});
    } catch (err) {
        chatDisplay.innerHTML = `Failed to load in configuration.json, please try reloading the page. <br> Error: ${err.message}`;

        chatDisplay.style.textShadow =
            '-1px -1px 0 black, ' +
            '1px -1px 0 black, ' +
            '-1px 1px 0 black, ' +
            '1px 1px 0 black';

        return;
    };

    // OVERLAY

    loadCustomBadges();

    // TTV

    const get_user = await getTwitchUser(settings.channel)

    channelTwitchID = get_user.id

    loadInBits()

    getBadges()

    //THIRD PARTY

    // 7TV

    load7TV();

    // BTTV

    loadBTTV();

    // FFZ

    loadFFZ();
}

async function loadCustomBadges() {
    const response = await fetch('https://api.github.com/gists/7f360e3e1d6457f843899055a6210fd6');

    if (!response.ok) { return; }

    let data = await response.json()

    if (!data["files"] || !data["files"]["badges.json"] || !data["files"]["badges.json"]["content"]) { return; }

    data = JSON.parse(data["files"]["badges.json"]["content"])

    if (!data || !data["YAUTO"]) { return; }

    customBadgeData = [...data?.["YAUTO"], ...data?.["YAUTC"]];
}

async function getVersion() {
    const version_response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://static.twitchcdn.net/config/manifest.json?v=1')}`)

    if (!version_response.ok) {
        console.log(version_response)
        return false
    }

    let version_data = await version_response.json()

    if (!version_data["contents"]) { return; }

    version_data = JSON.parse(version_data["contents"])

    version = version_data.channels[0].releases[0].buildId

    console.log(`Build version: ${version}`)
}

function removeInvisibleElements() {
    const elements = chatDisplay.children;

    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const rect = element.getBoundingClientRect();
        const chatDisplayRect = chatDisplay.getBoundingClientRect();

        if (
            rect.bottom < chatDisplayRect.top ||
            rect.top > chatDisplayRect.bottom
        ) {
            chatDisplay.removeChild(element);
        }
    }
}

async function deleteMessages(attribute, value) {
    if (!await getSetting("modAction")) { return; }

    if (attribute) {
        const elementsToDelete = chatDisplay.querySelectorAll(`[${attribute}="${value}"]`);

        elementsToDelete.forEach(element => {
            element.remove();
        });
    } else {
        chatDisplay.innerHTML = '';
    }
}

if (document.location.href.includes("?channel=")) {
    client.on("redeem", (channel, userstate, message) => {
        TTVUserRedeems[`${userstate}`] = userstate;

        setTimeout(() => {
            delete TTVUserRedeems[`${userstate}`];
        }, 5000);
    });

    // CHEER

    client.on("cheer", (channel, userstate, message) => {
        handleMessage(userstate, message, channel)
    });

    // MODERATION ACTIONS

    client.on("timeout", (channel, username, reason, duration, userstate) => {
        deleteMessages("sender", String(username))
    });

    client.on("ban", (channel, username, reason, userstate) => {
        deleteMessages("sender", String(username))
    });

    client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
        deleteMessages("message_id", String(userstate["target-msg-id"]))
    });

    client.on("clearchat", (channel) => {
        deleteMessages()
    });

    loadChat()
    setInterval(removeInvisibleElements, 500);
    setInterval(loadCustomBadges, 300000);
}

function handleImageRetries() {
    document.querySelectorAll('img').forEach((img, index) => {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            setTimeout(() => {
                img.src = img.src.split('?')[0] + '?retry=' + new Date().getTime();
            }, 500 * index);
        }
    });
}

setInterval(handleImageRetries, 10000);