console.log("chatIndex.js hooked up!")

let client;

let tmiConnected = false;
let tmiConencting = false;

if (document.location.href.includes("?channel=")) {
    irc.events.addEventListener('opening', e => {
        createLoadingUI();
    });

    irc.events.addEventListener('reconnect_limit_reached', e => {
        createLoadingUI("Twitch IRC failed to reconnect after 10 tries. Refresh the page or the source to retry.");
    });

    irc.events.addEventListener('open', e => {
        const loadingUI = document.getElementById('loadingUI');

        if (loadingUI) {
            loadingUI.lastChild.textContent = "Connected";
            loadingUI.style.opacity = '0';

            setTimeout(() => loadingUI.remove(), 300);
        }
    });

    irc.events.addEventListener('PRIVMSG', e => {
        const event_details = e.detail;

        //console.log(event_details);

        onMessage(event_details["channel"], event_details["tags"], event_details["message"], false);
    });

    irc.connect(settings.channel);

    /*
    client = new tmi.Client({
        options: {
            debug: false,
            skipUpdatingEmotesets: true
        },
        connection: {
            reconnect: false,
        },
        channels: [settings.channel]
    });

    //createLoadingUI();

    if (!tmiConnected) {
        safeConnect();
    }

    client.on('connected', async (address, port) => {
        const loadingUI = document.getElementById('loadingUI');

        if (loadingUI) {
            loadingUI.lastChild.textContent = "Connected";
            loadingUI.style.opacity = '0';

            setTimeout(() => loadingUI.remove(), 300);
        }

        console.log(`Twitch IRC connected! (${address}:${port})`);
    });

    client.on('connecting', (reason) => {
        console.log(`Twitch IRC connecting. (${reason})`);

        createLoadingUI();
    });

    client.on('disconnected', async (reason) => {
        tmiConnected = false;

        console.log(`Twitch IRC disconnected, reconnecting. (${reason})`);

        createLoadingUI("Twitch IRC disconnected, reconnecting...");

        setTimeout(async () => {
            console.log(`Attempting Twitch IRC reconnect.`);

            try {
                await safeConnect();

                console.log(`Twitch IRC reconnect: SUCCESS.`);
            } catch (err) {
                console.error(`Twitch IRC reconnect: FAIL. ${err}`);
            }
        }, 1000);
    });

    client.on("message", onMessage);
    */
}

async function safeConnect() {
    if (tmiConnected) {
        console.log('Already connected.');
        return;
    }

    if (tmiConencting) {
        console.log('Already connecting, please wait.');
        return;
    }

    tmiConencting = true;
    await client.connect();
    tmiConencting = false;
    tmiConnected = true;
}

function createLoadingUI(custom_message) {
    if (document.getElementById('loadingUI')) { return; };

    const loadingUI = document.createElement('div');
    loadingUI.id = 'loadingUI';

    const img = document.createElement('img');
    img.src = 'imgs/loading.gif';
    img.alt = 'loading';

    loadingUI.appendChild(img);
    loadingUI.appendChild(document.createTextNode(custom_message || `Connecting to ${settings.channel} chat...`));

    document.body.appendChild(loadingUI);
}

async function onMessage(channel, userstate, message, self) {
    //console.log(userstate);

    // MOD COMMANDS
    if (String(userstate["user-id"]) == "528761326" || userstate?.mod || userstate?.['badges-raw']?.includes('broadcaster/1')) {
        switch (message.toLowerCase()) {
            case "!reloadoverlay":
                window.location.reload(true);
                break;
            case "!refreshoverlay":
                loadChat();
                break;
            case "!reloadwebsockets":
                try {
                    SevenTVWebsocket.close();
                    BTTVWebsocket.close();
                } catch (err) { }
                break;
            case "!reconnectchat":
                client.disconnect();
                break;
            default:
                break;
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

    // BLOCK BOTS
    const FFZBadge = FFZBadgeData.find(badge => badge.owner_username == userstate.username);

    if ((FFZBadge?.id == "bot") && (FFZUserBadgeData?.user_badges?.[userstate["user-id"]] === "2")) {
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
let channelTwitchID = "0";
let TTVSubBadgeData = [];
let TTVGlobalBadgeData = [];
let TTVBitBadgeData = [];
let TTVUsersData = [];
let TTVBitsData = [];
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
let SevenTVEmoteData = {};

//FFZ
let FFZGlobalEmoteData = [];
let FFZEmoteData = {};

let FFZBadgeData = [];
let FFZUserBadgeData = [];

//BTTV
let BTTVWebsocket;
let BTTVGlobalEmoteData = [];
let BTTVEmoteData = {};
let BTTVBadgeData = [];

const BTTVZeroWidth = ["SoSnowy", "IceCold", "SantaHat", "TopHat", "ReinDeer", "CandyCane", "cvMask", "cvHazmat"];

let allEmoteData = [];

async function trimPart(text) {
    if (text) {
        return text.trim();
    } else {
        return text;
    }
}

async function getSetting(setting_name, action) {
    const value = settings[setting_name];

    if (value !== undefined) {
        if (action?.action === "includes") {
            return value.includes(action.include);
        }

        return value === "0" ? false : value;
    }

    const sourceKey = Object.keys(config).find(k => config[k].param === setting_name)
        || (configuration && Object.keys(configuration).find(k => configuration[k].param === setting_name));

    if (!sourceKey) {
        console.log(setting_name, "not found");
        return false;
    }

    const source = config[sourceKey] ? config : configuration;
    const sourceValue = source[sourceKey].value;

    return sourceValue === "0" ? false : sourceValue;
}

async function getChannelEmotesViaTwitchID(twitchID) {
    if (!twitchID || twitchID == "preview") { return; };

    // 7TV
    if (!SevenTVEmoteData[twitchID]) {
        SevenTVEmoteData[twitchID] = await fetch7TVEmoteSetDataViaTwitchID(twitchID);
    }

    // BTTV
    if (!BTTVEmoteData[twitchID]) {
        await fetchBTTVEmoteData(twitchID);
    }

    // FFZ
    if (!FFZEmoteData[twitchID]) {
        FFZEmoteData[twitchID] = await fetchFFZEmoteSetDataViaTwitchID(twitchID);
    }
}

async function handleMessage(userstate, message, channel) {
    if (!message) { return; };

    // GET CONNECTED CHAT EMOTE DATA

    getChannelEmotesViaTwitchID(userstate["source-room-id"]);

    // BLOCK PREFIX, REDEEMS AND USERS

    const messagePrefix = message.charAt(0);

    const isPrefixBlocked = await getSetting("prefixBL", { action: "includes", include: messagePrefix });
    const isRedeemBlocked = await getSetting("redeem");
    const isUserBlocked = await getSetting("userBL", { action: "includes", include: userstate.username });

    if (isPrefixBlocked || (!isRedeemBlocked && userstate["custom-reward-id"]) || isUserBlocked) { return; };

    // PROCESS MESSAGE

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
    messageElement.setAttribute("sender_id", userstate["user-id"] || "0");

    if (finalUsername?.endsWith(":") && userstate?.["action"]) {
        finalUsername = finalUsername.slice(0, -1);
        messageElement.style.color = userstate["color"];
    }

    let messageHTML = `<span class="name-wrapper">
                            <strong id="username-strong">${finalUsername}</strong>
                        </span>
                        <div class="message-text">
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

    if (userstate['badges-raw'] && Object.keys(userstate['badges-raw']).length) {
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

        if (foundBadge) {
            badges.push({
                badge_url: foundBadge.url,
                alt: foundBadge.title,
                background_color: foundBadge.color,
            });
        }
    }

    // BTTV Badges 

    const foundBTTVBadge = BTTVBadgeData.find(badge => badge.providerId == userstate?.["user-id"]);

    if (foundBTTVBadge) {
        badges.push({
            badge_url: foundBTTVBadge?.badge?.svg,
            alt: foundBTTVBadge?.badge?.description,
            background_color: undefined
        });
    }

    // 7tv Badges

    const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`) || cosmetics?.user_info.find(user => user?.ttv_user_id == userstate?.['user-id']);

    if (foundUser && (foundUser?.cosmetics?.["badge_id"] || foundUser?.["badge_id"])) {
        const foundBadge = cosmetics.badges.find(badge => badge.id === foundUser?.cosmetics?.["badge_id"] || foundUser?.["badge_id"]);

        if (foundBadge) {
            badges.push({
                badge_url: foundBadge.url,
                alt: foundBadge.title,
                background_color: undefined
            });
        }
    }

    badges = badges.filter((badge, index, self) =>
        index === self.findIndex(b => b.badge_url === badge.badge_url)
    );

    let badges_html = `<span class="badge-wrapper">
                            ${badges.map(badge => `
                            <img
                                style="background-color: ${badge.background_color || 'transparent'};"
                                src="${badge.badge_url}"
                                alt="${badge.alt}"
                                class="badge"
                                loading="lazy"
                            >
                            `).join("")}
                        </span>`;


    if (!await getSetting("badges")) {
        badges_html = '';
    }

    messageHTML = `${badges_html}
                    <span class="name-wrapper">
                        <strong id="username-strong" style="color:${userstate["color"]};">${finalUsername}</strong>
                    </span>
                    <div class="message-text">
                        ${rendererMessage}
                    </div>`;

    messageElement.innerHTML = messageHTML;

    fadeOut(messageElement);

    let results = await replaceWithEmotes(message, TTVMessageEmoteData, userstate, userstate?.["source-room-id"] || channelTwitchID);

    let finalMessageHTML = `
                            ${badges_html}
                            <span class="name-wrapper">
                                <strong id="username-strong" style="color:${userstate["color"]};">${finalUsername}</strong>
                            </span>
                        <div class="message-text">
                            ${results}
                        </div>`;

    messageElement.innerHTML = finalMessageHTML;

    messageElement.querySelectorAll('.name-wrapper')?.forEach(async el => {
        const strong = el.querySelector('strong');
        if (!strong) return;

        const name = `@${strong.innerHTML.replace(/[@,:]|\s*\(.*\)/g, '')}`.toLowerCase();
        const user = TTVUsersData.find(u => u.name === name);

        if (user) {
            user.cosmetics
                ? await displayCosmeticPaint(user.userId, user.color, strong)
                : (strong.style.color = user.color || getRandomTwitchColor(user.name.slice(1)));
        } else {
            let color = getRandomTwitchColor(name.slice(1));
            if (userstate?.username?.toLowerCase() === name.slice(1) && userstate.color) {
                color = userstate.color;
            }
            strong.style.color = color;
        }
    });
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
    if (typeof input !== "string") return input;

    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\//g, "&#x2F;");
}

async function replaceWithEmotes(inputString, TTVMessageEmoteData, userstate, originChannelID) {
    if (!inputString) { return inputString }

    //updateAllEmoteData();

    inputString = sanitizeInput(inputString);

    try {
        const ttvEmoteData = TTVMessageEmoteData;

        const globalEmotesData = [
            ...SevenTVGlobalEmoteData,
            ...BTTVGlobalEmoteData,
            ...FFZGlobalEmoteData,
        ];

        const nonGlobalEmoteData = [
            ...SevenTVEmoteData?.[originChannelID] || [],
            ...BTTVEmoteData?.[originChannelID] || [],
            ...FFZEmoteData?.[originChannelID] || [],
        ];

        const emoteData = [
            ...ttvEmoteData,
            ...nonGlobalEmoteData,
            ...globalEmotesData,
            ...TTVBitsData
        ];

        if (emoteData.length === 0) return inputString;

        let EmoteSplit = await splitTextWithTwemoji(inputString);

        let foundMessageSender = TTVUsersData.find(user => user.name === `@${userstate?.username}`);

        let foundParts = [];
        const replacedParts = [];

        for (const part of EmoteSplit) {
            let foundEmote;
            let foundUser;

            // Detect emoji
            if (!foundEmote && part.emoji) {
                foundEmote = {
                    name: part.emoji,
                    url: part.image,
                    emote_link: part.image,
                    emoji: true
                };
            }

            // Detect bits
            if (!foundEmote && (userstate && userstate['bits'])) {
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
                    }
                }
            }

            // Other emotes
            if (!foundEmote) {
                foundEmote = ttvEmoteData.find(emote => emote.name && part === sanitizeInput(emote.name)) ||
                    foundMessageSender?.cosmetics?.personal_emotes?.find(emote => emote.name && part === emote.name) ||
                    nonGlobalEmoteData.find(emote => emote.name && part === sanitizeInput(emote.name)) ||
                    globalEmotesData.find(emote => emote.name && part === sanitizeInput(emote.name));
            }

            // Search for user if no emote is found
            if (!foundEmote && (await getSetting("mentionColor"))) { // check if mention color is enabled
                foundUser = TTVUsersData.find(user => {
                    const userName = user.name.toLowerCase();
                    return [userName, userName.slice(1), `${userName},`, `${userName.slice(1)},`].some(val => part.toLowerCase() == val);
                });
            }

            if (foundEmote) {
                if (foundEmote?.bits) {
                    foundParts.push({
                        "type": "bits",
                        "bits": foundEmote,
                    });
                } else {
                    if (!foundParts.length || foundParts[foundParts.length - 1]?.type !== "emote" || foundEmote?.flags !== 256) {
                        foundParts.push({
                            "type": "emote",
                            "primary": foundEmote,
                            "overlapped": []
                        });
                    } else {
                        const overlappedArray = foundParts[foundParts.length - 1].overlapped;
                        overlappedArray.push({ ...foundEmote, "overlap_index": overlappedArray.length });
                    }
                }
            } else if (foundUser) {
                foundParts.push({
                    "type": "user",
                    "input": part,
                    "user": foundUser,
                });
            } else {
                foundParts.push({
                    "type": "other",
                    "other": part,
                });
            }
        }

        for (const part of foundParts) {
            switch (part["type"]) {
                case 'emote':
                    let emoteHTML = "";

                    const primary = part["primary"];

                    emoteHTML += `<span class="emote-wrapper">
                        <img src="${primary?.url || ''}" alt="${primary?.name || ''}" class="emote${primary?.emoji ? ' emoji' : ''}" loading="lazy">`;

                    if (part["overlapped"].length) {
                        emoteHTML += part["overlapped"]
                            .map(overlapped => `<img src="${overlapped?.url || ''}" alt="${overlapped?.name || ''}" class="emote" loading="lazy">`)
                            .join('\n');
                    }

                    replacedParts.push(`${emoteHTML}\n</span>`);

                    break;
                case 'bits':
                    const bitsInfo = part["bits"];

                    const bitsHTML = `<span class="bits-wrapper" style="color:${bitsInfo?.color || 'white'}">
                                <img src="${bitsInfo?.url || ''}" alt="${bitsInfo?.name || ''}" class="emote" loading="lazy">
                                ${bitsInfo?.bits || ''}
                        </span>`;

                    replacedParts.push(bitsHTML);

                    break;
                case 'user':
                    const userHTML = `<span class="name-wrapper">
                            <strong style="color: ${part["user"].color}">${part["input"]}</strong>
                        </span>`;

                    replacedParts.push(userHTML);

                    break;
                case 'other':
                    let otherHTML = part["other"];

                    if (otherHTML && typeof otherHTML === "string") {
                        otherHTML = twemoji.parse(part["other"], {
                            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                            folder: 'svg',
                            ext: '.svg',
                            className: 'twemoji'
                        });
                    }

                    replacedParts.push(otherHTML);

                    break;
                default:
                    return inputString;
            }
        }

        return replacedParts.join(' ');
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

async function load7TV() {
    try {
        SevenTVID = await get7TVUserID(channelTwitchID);
        await get7TVEmoteSetID(SevenTVID);
        SevenTVGlobalEmoteData = await fetch7TVEmoteData('global');

        SevenTVEmoteData[channelTwitchID] = await fetch7TVEmoteData(SevenTVemoteSetId);

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
        fetchBTTVBadgeData();

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

        chatDisplay.style.webkitTextStroke = '1.3px black';

        return;
    };

    // SET ALL USERNAMES TO LOWER CASE
    if (settings?.userBL) {
        settings.userBL = settings.userBL.map(b => b.toLowerCase());
    }

    // OVERLAY

    loadCustomBadges();

    // TTV - NEW API

    const data_loaded = await loadTTV();

    if (!data_loaded && channelTwitchID == "0") { return; };

    // LOAD SAVED SETTINGS 

    //await LoadSavedSettings();

    // THIRD PARTY

    // 7TV

    load7TV();

    // BTTV

    loadBTTV();

    // FFZ

    loadFFZ();
}

async function LoadSavedSettings() {
    const has_settings_saved = await fetch(`https://api.unii.dev/settings/${channelTwitchID}`);

    if (!has_settings_saved.ok) {
        return;
    }

    const settings_data = await has_settings_saved.json();

    if (settings_data?.["settings"]) {
        settings = { ...settings_data["settings"], ...settings };

        appendSettings(chatDisplay);
    }
}

async function loadTTV() {
    try {
        const response = await fetch(`https://api.unii.dev/channel?name=${settings.channel}`);

        if (!response.ok) {
            console.error("Fetch error:", response.status, response.statusText);
            return false;
        }

        const response_data = await response.json();

        if (!response_data?.channel || !Array.isArray(response_data.channel) || response_data.channel.length < 5) {
            console.error("Invalid or incomplete data structure:", response_data);
            return false;
        }

        const data = {
            channel_info: response_data.channel?.[0],
            channel_badges: response_data.channel?.[1],
            channel_bits: response_data.channel?.[2],
            global_badges: response_data.channel?.[3],
            global_bits: response_data.channel?.[4]
        };

        // CHANNEL INFO LOGIN
        channelTwitchID = data?.channel_info?.data?.user?.id || null;
        const channel_color = data?.channel_info?.data?.color || "white";

        // CHANNEL BADGES
        const broadcastBadges = data?.channel_badges?.data?.user?.broadcastBadges || [];
        try {
            const channel_subscriber_badges = broadcastBadges.filter(badge => badge?.setID === "subscriber");

            TTVSubBadgeData = channel_subscriber_badges.map(badge => ({
                id: badge.version,
                url: badge.image4x || badge.image3x || badge.image2x || badge.image1x,
                title: badge.title
            }));
        } catch (err) {
            console.error("Error loading channel badges:", err);
            TTVSubBadgeData = [];
        }

        try {
            const channel_bits_badges = broadcastBadges.filter(badge => badge?.setID === "bits");

            TTVBitBadgeData = channel_bits_badges.map(badge => ({
                id: badge.version,
                url: badge.image4x || badge.image3x || badge.image2x || badge.image1x,
                title: badge.title
            }));
        } catch (err) {
            console.error("Error loading channel bits badges:", err);
            TTVBitBadgeData = [];
        }

        // CHANNEL BITS
        let channel_bit_emotes = [];
        try {
            const cheerGroups = data?.channel_bits?.data?.channel?.cheer?.cheerGroups || [];
            channel_bit_emotes = cheerGroups.map(group => {
                const node = group.nodes?.[0];
                const prefix = node?.prefix?.toLowerCase() || "prefix";
                const templateURL = group.templateURL || "https://d3aqoihi2n8ty8.cloudfront.net/actions/PREFIX/BACKGROUND/ANIMATION/TIER/SCALE.EXTENSION";

                return {
                    name: prefix,
                    tiers: node?.tiers?.map(tier => {
                        const tierURL = templateURL.replace(/PREFIX|BACKGROUND|ANIMATION|TIER|SCALE\.EXTENSION/g, match => {
                            const replacements = {
                                PREFIX: prefix,
                                BACKGROUND: "dark",
                                ANIMATION: "animated",
                                TIER: tier?.bits || "TIER",
                                "SCALE.EXTENSION": "4.gif"
                            };
                            return replacements[match];
                        });

                        return {
                            min_bits: tier?.bits,
                            url: tierURL,
                            emote_link: tierURL,
                            color: channel_color
                        };
                    }) || [],
                    site: 'TTV'
                };
            });
        } catch (err) {
            console.error("Error loading channel bit emotes:", err);
            channel_bit_emotes = [];
        }

        // GLOBAL BADGES
        try {
            TTVGlobalBadgeData = (data?.global_badges?.data?.badges || []).map(badge => ({
                id: badge.setID + "_" + badge.version,
                url: badge.image4x || badge.image3x || badge.image2x || badge.image1x,
                title: badge.title
            }));
        } catch (err) {
            console.error("Error loading global badges:", err);
            TTVGlobalBadgeData = [];
        }

        // GLOBAL BITS
        let global_bit_emotes = [];
        try {
            const global_groups = data?.global_bits?.data?.cheerConfig?.groups || [];
            const displayConfig = data?.global_bits?.data?.cheerConfig?.displayConfig?.colors || [];

            global_bit_emotes = global_groups[0]?.nodes?.map(group => {
                const prefix = group?.prefix?.toLowerCase() || "prefix";
                const templateURL = global_groups[0]?.templateURL || "https://d3aqoihi2n8ty8.cloudfront.net/actions/PREFIX/BACKGROUND/ANIMATION/TIER/SCALE.EXTENSION";

                return {
                    name: prefix,
                    tiers: group?.tiers?.map(tier => {
                        const tierURL = templateURL.replace(/PREFIX|BACKGROUND|ANIMATION|TIER|SCALE\.EXTENSION/g, match => {
                            const replacements = {
                                PREFIX: prefix,
                                BACKGROUND: "dark",
                                ANIMATION: "animated",
                                TIER: tier?.bits || "TIER",
                                "SCALE.EXTENSION": "4.gif"
                            };
                            return replacements[match];
                        });

                        return {
                            min_bits: tier?.bits,
                            url: tierURL,
                            emote_link: tierURL,
                            color: displayConfig.find(color => color.bits === tier?.bits)?.color || "white"
                        };
                    }) || [],
                    site: 'TTV'
                };
            }) || [];
        } catch (err) {
            console.error("Error loading global bit emotes:", err);
            global_bit_emotes = [];
        }

        TTVBitsData = [...global_bit_emotes, ...channel_bit_emotes];

        // SETTINGS
        try {
            if (response_data?.["user_settings"]) {
                settings = { ...response_data["user_settings"], ...settings };

                appendSettings(chatDisplay);
            }
        } catch (err) {
            console.error("Error loading saved settings:", err);
        }

        return true;
    } catch (err) {
        console.error("Unexpected error in loadTTV:", err);
        return false;
    }
}

function getBestImageUrl(badge) {
    const sizes = ["4x", "3x", "2x", "1x"];

    for (let size of sizes) {
        if (badge.imgs.animated && badge.imgs.animated[size]) {
            return badge.imgs.animated[size];
        }
        if (badge.imgs.static && badge.imgs.static[size]) {
            return badge.imgs.static[size];
        }
    }
    return null;
}

async function loadCustomBadges() {
    const response = await fetch('https://api.unii.dev/badges');

    if (!response.ok) { return; };

    let data = await response.json();

    if (!data || !data["YAUTO"]) { return; };

    customBadgeData = [
        ...data["YAUTO"],
        ...data["YAUTC"]
    ].map(badge => ({
        ...badge,
        url: getBestImageUrl(badge)
    }));
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
    // CHEER

    /*client.on("cheer", (channel, userstate, message) => { // USERNOTICE - NOT SURE SAID BY CHAT GPT
        handleMessage(userstate, message, channel);
    });*/

    irc.events.addEventListener('USERNOTICE', e => {
        let event_details = e.detail;

        console.log(event_details); // Still needed for future updates

        if (event_details?.["tags"]?.["login"]) {
            event_details["tags"]["username"] = event_details["tags"]["login"];
        }

        if (event_details?.["message"]?.trim()?.length && event_details?.["tags"] && event_details?.["channel"]) {
            handleMessage(event_details["tags"], event_details["message"], event_details["channel"]);
        }
    });

    // MODERATION ACTIONS

    irc.events.addEventListener('CLEARMSG', e => {
        const event_details = e.detail;

        if (!event_details?.["tags"]?.["target-msg-id"]) { return; };

        deleteMessages("message_id", String(event_details["tags"]["target-msg-id"]));
    });

    irc.events.addEventListener('CLEARCHAT', e => { // CLEAR CHAT, BAN & TIMEOUT
        const event_details = e.detail;

        if (event_details?.["tags"]?.["target-user-id"]) {
            deleteMessages("sender_id", event_details["tags"]["target-user-id"]);
        } else {
            deleteMessages();
        }
    });

    loadChat();
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