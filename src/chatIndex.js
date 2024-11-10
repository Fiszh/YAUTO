console.log("chat index.js hooked up!")

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";

const client = new tmi.Client({
    options: {
        debug: false,
        skipUpdatingEmotesets: true
    },
    channels: [settings.channel]
});

client.connect()

client.on('connected', async (address, port) => {
    console.log("connected!")
});

client.on("message", async (channel, userstate, message, self) => {
    const FFZBadge = FFZBadgeData.find(badge => badge.owner_username == userstate.username)

    // BLOCK BOTS

    if (FFZBadge && FFZBadge.id && FFZBadge.id == "bot") {
        if (settings && settings.bots && settings.bots == "0") {
            return
        }
    }

    if (FFZUserBadgeData && FFZUserBadgeData["user_badges"] && FFZUserBadgeData["user_badges"][userstate.username] && FFZUserBadgeData["user_badges"][userstate.username] === "2") {
        if (settings && settings.bots && settings.bots == "0") {
            return
        }
    }

    // BLOCK PREFIX

    const messagePrefix = message.charAt(0);

    if (settings && settings.prefixBL && settings.prefixBL.includes(messagePrefix)) {
        return
    }

    // BLOCK USERS

    if (settings && settings.userBL && settings.userBL.includes(userstate.username)) {
        return
    }

    // MOD RELOAD COMMAND

    if (userstate['badges-raw'] || String(userstate["user-id"]) === "528761326") {
        if (String(userstate["user-id"]) === "528761326" || userstate.mod || userstate['badges-raw'].includes('broadcaster/1')) {
            if (message.toLowerCase() === "!reloadoverlay") {
                window.location.reload(true);
            } else if (message.toLowerCase() === "!refreshoverlay") {
                window.location.reload();
            } else if (message.toLowerCase() === "!reloadwebsockets") {
                try {
                    SevenTVWebsocket.close();
                    BTTVWebsocket.close();
                } catch(err) {}
            }
        }
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
});

let chatDisplay = document.getElementById("ChatDisplay");

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
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#800080", // Purple
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#FFC0CB", // Pink
    "#FF1493", // Deep Pink
    "#FFD700", // Gold
    "#1E90FF", // Dodger Blue
    "#FF69B4", // Hot Pink
    "#2E8B57", // Sea Green
    "#6A5ACD", // Slate Blue
    "#9932CC", // Dark Orchid
    "#D2691E", // Chocolate
    "#008080", // Teal
    "#9370DB", // Medium Purple
    "#008B8B", // Dark Cyan
    "#CD5C5C"  // Indian Red
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

async function trimPart(text) {
    if (text) {
        return text.trim()
    } else {
        return text
    }
}

async function handleMessage(userstate, message, channel) {
    if (!message) { return; }

    if (settings && settings.redeem && settings.redeem === '0') {
        if (TTVUserRedeems[userstate.username]) {
            delete TTVUserRedeems[userstate.username];
            return; 
        }
    }

    message = String(message)

    const tagsReplaced = message
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    if (userstate["user-id"] === "528761326") {
        userstate["badges-raw"] += ',YAUTCDev/1';
    }

    if (["404660262", "166427338"].includes(userstate["user-id"])) {
        userstate["badges-raw"] += ',YAUTCContributor/1';
    }

    if (["413189785", "61094148"].includes(userstate["user-id"])) {
        userstate["badges-raw"] += ',YAUTCTester/1';
    }

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

    let TTVMessageEmoteData = [];

    if (userstate.emotes && userstate.emotes !== "" && Object.keys(userstate.emotes).length > 0) {
        TTVMessageEmoteData = Object.entries(userstate.emotes).flatMap(([emoteId, positions]) =>
            positions.map(position => {
                const [start, end] = position.split('-').map(Number);
                return {
                    name: message.substring(start, end + 1),
                    url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
                    site: 'TTV'
                };
            })
        );
    }

    let badges = '';

    if (userstate['badges-raw'] && Object.keys(userstate['badges-raw']).length > 0) {
        let rawBadges = userstate['badges-raw'];
        let badgesSplit = rawBadges.split(',');

        for (const Badge of badgesSplit) {
            let badgeSplit = Badge.split("/");
            if (badgeSplit[0] === 'subscriber') continue;
            const badge = TTVGlobalBadgeData.find(badge => badge.id === `${badgeSplit[0]}_${badgeSplit[1]}`);

            if (badgeSplit[0] === 'bits' && userstate.badges && userstate.badges.bits) {
                const BitBadge = TTVBitBadgeData.find(badge => badge.id === userstate.badges.bits);
                if (BitBadge) continue;
            }

            if (badge && badge.id) {
                if (badge.id === "moderator_1" && FFZUserBadgeData["mod_badge"]) {
                    continue;
                }
    
                if (badge.id === "vip_1" && FFZUserBadgeData["vip_badge"]) {
                    continue;
                } 
            }

            if (badge) {
                badges += `<span class="badge-wrapper">
                            <img src="${badge.url}" alt="${badge.title}" class="badge">
                        </span>`;
            }
        }

        if (userstate.badges) {
            if (userstate.badges.subscriber) {
                const badge = TTVSubBadgeData.find(badge => badge.id === userstate.badges.subscriber);

                if (badge) {
                    badges += `<span class="badge-wrapper">
                                <img src="${badge.url}" alt="${badge.title}" class="badge">
                            </span>`;
                }
            }

            if (userstate.badges.bits) {
                const badge = TTVBitBadgeData.find(badge => badge.id === userstate.badges.bits);

                if (badge) {
                    badges += `<span class="badge-wrapper">
                                <img src="${badge.url}" alt="${badge.title}" class="badge">
                            </span>`;
                }
            }
        }
    }

    const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

    // FFZ Badges

    const foundFFZBadge = FFZBadgeData.find(badge => badge.owner_username == userstate.username);

    if (foundFFZBadge) {
        badges += `<span class="badge-wrapper">
                                <img style="background-color: ${foundFFZBadge.color};" src="${foundFFZBadge.url}" alt="${foundFFZBadge.title}" class="badge">
                            </span>`;
    }

    if (userstate['badges-raw'] && userstate['badges-raw'].includes('moderator/1') && FFZUserBadgeData["mod_badge"]) {
        badges += `<span class="badge-wrapper" tooltip-name="Moderator" tooltip-type="Badge" tooltip-creator="" tooltip-image="${FFZUserBadgeData["mod_badge"]}">
                                <img style="background-color: #00ad03;" src="${FFZUserBadgeData["mod_badge"]}" alt="Moderator" class="badge">
                            </span>`;
    }

    if (userstate['badges-raw'] && userstate['badges-raw'].includes('vip/1') && FFZUserBadgeData["vip_badge"]) {
        badges += `<span class="badge-wrapper" tooltip-name="VIP" tooltip-type="Badge" tooltip-creator="" tooltip-image="${FFZUserBadgeData["vip_badge"]}">
                                <img style="background-color: #e005b9;" src="${FFZUserBadgeData["vip_badge"]}" alt="VIP" class="badge">
                            </span>`;
    }

    if (FFZUserBadgeData["user_badges"] && FFZUserBadgeData["user_badges"][userstate.username]) {
        const foundBadge = FFZBadgeData.find(badge => badge.url === `https://cdn.frankerfacez.com/badge/${FFZUserBadgeData["user_badges"][userstate.username]}/4`)

        if (foundBadge) {
            badges += `<span class="badge-wrapper" tooltip-name="${foundBadge.title}" tooltip-type="Badge" tooltip-creator="" tooltip-image="${foundBadge.url}">
                                    <img style="background-color: ${foundBadge.color};" src="${foundBadge.url}" alt="${foundBadge.title}" class="badge">
                                </span>`;
        }
    }

    // 7tv Badges

    if (foundUser && foundUser.cosmetics && foundUser.cosmetics["badge_id"]) {
        const foundBadge = cosmetics.badges.find(Badge => Badge.id === foundUser.cosmetics["badge_id"]);

        if (foundBadge) {
            badges += `<span class="badge-wrapper" tooltip-name="${foundBadge.title}" tooltip-type="Badge" tooltip-creator="" tooltip-image="${foundBadge.url}">
                                <img src="${foundBadge.url}" alt="${foundBadge.title}" class="badge">
                            </span>`;
        }
    }

    if (settings && settings.msgCaps && settings.msgCaps === '1') {
        finalUsername = finalUsername.toUpperCase()
    }

    let rendererMessage = tagsReplaced

    if (settings && settings.msgBold && settings.msgBold === '1') {
        rendererMessage = `<strong>${tagsReplaced}</strong>`;
    }

    let messageHTML = `<div class="message-text">
                            ${badges}
                                <span class="name-wrapper">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${rendererMessage}
                        </div>`;

    messageElement.innerHTML = messageHTML;

    while (chatDisplay.children.length >= 500) {
        chatDisplay.removeChild(chatDisplay.firstChild);
    }

    // Append the new message element

    chatDisplay.appendChild(messageElement);

    fadeOut(messageElement)

    // Calling this function now removes the whole wait for the message to appear

    let results = await replaceWithEmotes(message, TTVMessageEmoteData, userstate);

    if (settings && settings.msgBold && settings.msgBold === '1') {
        results = `<strong>${results}</strong>`;
    }

    let finalMessageHTML = `<div class="message-text">
                            ${badges}
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
                const name = `@${strongElement.innerHTML.replace('@', '').replace(',', '').replace(':', '')}`.toLowerCase()

                const foundUser = TTVUsersData.find(user => user.name === name);

                if (foundUser) {
                    if (foundUser.cosmetics) {
                        await displayCosmeticPaint(foundUser.userId, foundUser.color, strongElement);
                    } else {
                        const randomColor = getRandomTwitchColor(userstate.username)
                        strongElement.style.color = userstate.color || randomColor;
                    }
                } else {
                    const randomColor = getRandomTwitchColor(userstate.username)
                    strongElement.style.color = userstate.color || randomColor;
                }
            }
        });
    }
}

async function fadeOut(element) {
    if (!settings || !settings.fadeOut) { return; }

    try {
        const fadeOutTime = settings.fadeOut * 1000

        setTimeout(() => {
            element.style.transition = 'opacity 1s ease';
            element.classList.add('fade');

            setTimeout(() => {
                element.remove();
            }, 1000);

        }, fadeOutTime || 30000);
    } catch (err) { }
}

async function checkPart(part, string) {
    if (settings && settings.mentionColor && settings.mentionColor === '0') { return false; }

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

async function replaceWithEmotes(inputString, TTVMessageEmoteData, userstate) {
    if (!inputString) { return inputString }
    let lastEmote = false;

    updateAllEmoteData()

    try {
        const ttvEmoteData = [
            ...TTVGlobalBadgeData,
            ...TTVMessageEmoteData,
        ];

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

        const EmoteSplit = inputString.split(/\s+/);

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
                            bits: bits
                        };

                        emoteType = 'Bits';
                    }
                }
            }

            // Prioritize ttvEmoteData
            for (const emote of ttvEmoteData) {
                if (part === emote.name) {
                    foundEmote = emote;
                    emoteType = emote.site;
                    break;
                }
            }

            // Prioritize personalEmotes
            if (foundMessageSender && foundMessageSender.cosmetics) {
                const cosmetics = foundMessageSender.cosmetics;

                if (cosmetics.personal_emotes && cosmetics.personal_emotes.length > 0) {
                    for (const emote of cosmetics.personal_emotes) {
                        if (part === emote.name) {
                            foundEmote = emote;
                            emoteType = 'Personal';
                            break;
                        }
                    }
                }
            }

            // Prioritize nonGlobalEmoteData
            if (!foundEmote) {
                for (const emote of nonGlobalEmoteData) {
                    if (part === emote.name) {
                        foundEmote = emote;
                        emoteType = emote.site;
                        break;
                    }
                }
            }

            // Search in allEmoteData
            if (!foundEmote) {
                for (const emote of allEmoteData) {
                    if (part === emote.name) {
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

                let additionalInfo = '';
                if (foundEmote.original_name && foundEmote.name !== foundEmote.original_name) {
                    additionalInfo += `, Alias of: ${foundEmote.original_name}`;
                }

                let creator = foundEmote.creator ? `Created by: ${foundEmote.cfreator}` : '';
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
                    emoteHTML = `<span class="emote-wrapper" tooltip-name="${foundEmote.name}${additionalInfo}" tooltip-type="${emoteType}" tooltip-creator="${creator}" tooltip-image="${foundEmote.url}" style="color:${foundEmote.color || 'white'}">
                            <a href="${foundEmote.emote_link || foundEmote.url}" target="_blank;" style="display: inline-flex; justify-content: center">
                                <img src="https://femboy.beauty/zN7uA" alt="ignore" class="emote" style="height: ${desiredHeight}px; width: ${foundEmote.width}px; position: relative; visibility: hidden;">
                                <img src="${foundEmote.url}" alt="${foundEmote.name}" class="emote" ${emoteStyle}>
                            </a>
                            ${foundEmote.bits || ''}
                        </span>`;
                } else if (lastEmoteWrapper && lastEmote && foundEmote.flags && foundEmote.flags === 256) {
                    willReturn = false;
                    emoteStyle = `style="height: ${desiredHeight}px; position: absolute;"`;
                    const aTag = lastEmoteWrapper.querySelector('a');
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

                if (settings && settings.msgCaps && settings.msgCaps === '1') {
                    part = part.toUpperCase()
                }

                const userHTML = `<span class="name-wrapper">
                            <strong style="color: ${foundUser.color}">${part}</strong>
                        </span>`;
                replacedParts.push(userHTML);
            } else {
                lastEmote = false;

                if (settings && settings.msgCaps && settings.msgCaps === '1') {
                    part = part.toUpperCase()
                }

                part = part
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')

                const twemojiHTML = twemoji.parse(part, {
                    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                    folder: 'svg',
                    ext: '.svg',
                    className: 'twemoji'
                });

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

    //CUSTOM BADGES

    TTVGlobalBadgeData.push({
        id: 'YAUTCDev' + "_" + 1,
        url: 'https://cdn.7tv.app/emote/01FD8MX8H80009D1JB6G15TFSA/4x.webp',
        title: 'YAUTC Dev'
    })

    TTVGlobalBadgeData.push({
        id: 'YAUTCContributor' + "_" + 1,
        url: 'https://cdn.7tv.app/emote/6565de391be41eb14272c825/4x.avif',
        title: 'YAUTO Contributor'
    })

    TTVGlobalBadgeData.push({
        id: 'YAUTCTester' + "_" + 1,
        url: 'https://cdn.7tv.app/emote/01HYJRKPGG0006K2DABY5APXFB/4x.webp',
        title: 'YAUTO Tester'
    })
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

async function getVersion() {
    const version_response = await fetch("https://api.spanix.team/proxy/https://static.twitchcdn.net/config/manifest.json?v=1")

    if (!version_response.ok) {
        console.log(version_response)
        return false
    }

    const version_data = await version_response.json()

    version = version_data.channels[0].releases[0].buildId
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

function deleteMessages(attribute, value) {
    if (settings && settings.modAction && settings.modAction === '0') { return; }

    if (attribute) {
        const elementsToDelete = chatDisplay.querySelectorAll(`[${attribute}="${value}"]`);

        elementsToDelete.forEach(element => {
            element.remove();
        });
    } else {
        chatDisplay.innerHTML = '';
    }
}

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
