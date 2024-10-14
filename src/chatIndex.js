console.log("chat index.js hooked up!")

const client = new tmi.Client({
    options: {
        debug: false,
        skipUpdatingEmotesets: true
    },
    //identity: {
    //    username: tmiUsername,
    //    password: tmiPass
    //},
    channels: [settings.channel]
});

client.connect()

client.on('connected', async (address, port) => {
    console.log("connected!")
});

client.on("message", (channel, userstate, message, self)  => {
    handleMessage(userstate, message, channel)
});

let chatDisplay = document.getElementById("ChatDisplay");

//TWITCH
let channelTwitchID = '0';
let userTwitchId = '0';
let TTVGlobalEmoteData = [];
let TTVEmoteData = [];
let TTVSubBadgeData = [];
let TTVBitBadgeData = [];
let TTVGlobalBadgeData = [];
let TTVUsersData = [];
let blockedUsersData = [];
let TTVBitsData = [];
let TTVWebSocket;

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

let BlockedEmotesData = [];

//FFZ
let FFZGlobalEmoteData = [];
let FFZEmoteData = [];

let FFZBadgeData = [];

//BTTV
let BTTVWebsocket;
let BTTVGlobalEmoteData = [];
let BTTVEmoteData = [];

let allEmoteData = [];

async function handleMessage(userstate, message, channel) {
    if (userstate["user-id"] === "528761326") {
        userstate["badges-raw"] += ',YAUTCDev/1';
    }

    let username = userstate.username;
    let displayname = userstate["display-name"]
    let finalUsername = userstate.username

    if (username && displayname) {
        if (username.toLowerCase() == displayname.toLowerCase()) {
            finalUsername = `${displayname}:`
        } else {
            finalUsername = `${username} (${displayname}):`
        }
    }

    const messageElement = document.createElement("div");
    messageElement.classList.add('message');

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

    if (false && userstate['badges-raw'] && Object.keys(userstate['badges-raw']).length > 0) {
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

    // 7tv Badges

    if (foundUser && foundUser.sevenTVData && foundUser.sevenTVData.badge.url) {
        badges += `<span class="badge-wrapper">
                                <img src="${foundUser.sevenTVData.badge.url}" alt="${foundUser.sevenTVData.badge.title}" class="badge">
                            </span>`;
    }

    // Determine the message HTML based on user information
    let messageHTML = `<div class="message-text">
                            ${badges}
                                <span class="name-wrapper">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${message}
                        </div>`;

    messageElement.innerHTML = messageHTML;

    while (chatDisplay.children.length >= 500) {
        chatDisplay.removeChild(chatDisplay.firstChild);
    }

    // Append the new message element
    chatDisplay.appendChild(messageElement);

    // Remove the whole wait for the message

    let results = await replaceWithEmotes(message, TTVMessageEmoteData, userstate);

    // Determine the message HTML based on user information

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
                    if (foundUser.sevenTVId && foundUser.sevenTVData) {
                        await setSevenTVPaint(strongElement, foundUser.sevenTVId, foundUser, foundUser.sevenTVData);
                    }
                } else {
                    const randomColor = getRandomTwitchColor()
                    strongElement.style.color = userstate.color || randomColor;
                }
            }
        });
    }
}

async function checkPart(part, string) {
    return (part.toLowerCase() === string)
}

function getRandomTwitchColor() {
    const randomIndex = Math.floor(Math.random() * twitchColors.length);
    return twitchColors[randomIndex];
}

async function replaceWithEmotes(inputString, TTVMessageEmoteData, userstate) {
    if (!inputString) { return inputString }
    let lastEmote = false;

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
            const part = EmoteSplit[i];
            let foundEmote;
            let foundUser;
            let emoteType = '';

            if (false && userstate && userstate['bits']) {
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
            if (foundMessageSender && foundMessageSender.sevenTVData) {
                const sevenTVData = foundMessageSender.sevenTVData;

                if (sevenTVData.personal_emotes && sevenTVData.personal_emotes.length > 0) {
                    for (const emote of sevenTVData.personal_emotes) {
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

                let creator = foundEmote.creator ? `Created by: ${foundEmote.creator}` : '';
                let emoteStyle = 'style="height: 36px; position: absolute;"';

                if (BlockedEmotesData.find(emote => emote.url == foundEmote.url)) {
                    emoteStyle = 'style="filter: blur(10px); height: 36px; position: absolute;"';
                }

                let { width, height } = foundEmote.width && foundEmote.height
                    ? { width: foundEmote.width, height: foundEmote.height }
                    : await getImageSize(foundEmote.url);

                const desiredHeight = 36;

                // Calculate the aspect ratio if height and width are already present
                if (width && height) {
                    const aspectRatio = calculateAspectRatio(width, height, desiredHeight);
                    foundEmote.width = aspectRatio.width;
                    foundEmote.height = desiredHeight;
                } else {
                    foundEmote.height = desiredHeight;
                }

                console.log(foundEmote.height)
                console.log(foundEmote.width)

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
                                <img src="https://femboy.beauty/zN7uA" alt="ignore" class="emote" style="height: 36px; width: ${foundEmote.width}px; position: relative; visibility: hidden;">
                                <img src="${foundEmote.url}" alt="${foundEmote.name}" class="emote" ${emoteStyle}>
                            </a>
                            ${foundEmote.bits || ''}
                        </span>`;
                } else if (lastEmoteWrapper && lastEmote && foundEmote.flags && foundEmote.flags === 256) {
                    willReturn = false;
                    emoteStyle = 'style="height: 36px; position: absolute;"';
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

                const userHTML = `<span class="name-wrapper">
                            <strong style="color: ${foundUser.color}">${part}</strong>
                        </span>`;
                replacedParts.push(userHTML);
            } else {
                lastEmote = false;

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
            const desiredHeight = 36;
            const dimensions = calculateAspectRatio(width, height, desiredHeight);

            resolve(dimensions);
        } else if (typeof urlOrDimensions === 'string') {
            const img = document.createElement('img');
            img.style.display = 'none';

            const loadImage = (attempt) => {
                img.onload = function () {
                    const naturalWidth = this.naturalWidth;
                    const naturalHeight = this.naturalHeight;

                    const desiredHeight = 36;
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

function getUser() {
    
}

function scrollToBottom() {
    chatDisplay.scrollTo({
        top: chatDisplay.scrollHeight,
        behavior: 'smooth'
    });
}

setInterval(scrollToBottom, 500);