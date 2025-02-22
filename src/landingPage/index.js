const urlDiv = document.getElementById("url-results");
let lastUrl = urlDiv.textContent.trim();

const button = document.getElementById("colorToggleButton");
let isWhite = false;

// APPEND SHADOW STYLE TO MAKE IT VISIBLE IN PREVIEW
var shadow_style = document.createElement('style');
document.head.appendChild(shadow_style);

let images = [
    "https://cdn.7tv.app/emote/6297ed14d1b61557a52b21cb/4x.webp",
    "https://cdn.7tv.app/emote/6356194e5cc38d00a55f4015/4x.webp",
    "https://cdn.7tv.app/emote/6146d4233d8c2d23697a8ae6/4x.webp",
    "https://cdn.7tv.app/emote/63204c4d640b39113b17fcd9/4x.webp",
    "https://cdn.7tv.app/emote/6326788b1e9f2f8cdb340299/4x.webp",
    "https://cdn.7tv.app/emote/62f180028b744b87349e1bae/4x.webp",
    "https://cdn.7tv.app/emote/641e367bfdd6b1a12218dec0/4x.webp",
    "https://cdn.7tv.app/emote/63b220e16b3fa76ec56f60e3/4x.webp",
    "https://cdn.7tv.app/emote/62e457c4df0fbee3a2f7f320/4x.webp",
    "https://cdn.7tv.app/emote/63515a66213f8d195d66923b/4x.webp",
    "https://cdn.7tv.app/emote/6300bf83b8ebf389d2ee947c/4x.webp",
    "https://cdn.7tv.app/emote/6480c39fd4b5d6083e92d55d/4x.webp",
    "https://cdn.7tv.app/emote/62982b6dfad983b04450b7d4/4x.webp",
    "https://cdn.7tv.app/emote/62c452659882dfa63c81c80a/4x.webp",
    "https://cdn.7tv.app/emote/65402375ee0d08affebd058c/4x.webp",
    "https://cdn.7tv.app/emote/62e37e3b680a10b92c6fb5c4/4x.webp",
    "https://cdn.7tv.app/emote/64783d82cc463d3ee4a9b320/4x.webp",
    "https://cdn.7tv.app/emote/647a6e92804ca09ebf23ea0c/4x.webp",
    "https://cdn.7tv.app/emote/6565de391be41eb14272c825/4x.webp",
    "https://cdn.7tv.app/emote/65ee67828df6031fa99d9062/4x.webp",
    "https://cdn.7tv.app/emote/6592122fdbf474d8368df037/4x.webp",
    "https://cdn.7tv.app/emote/64e773690b36851cbc32b4c8/4x.webp"
];

const PreviewMessages = [
    {
        userstate: {
            "username": 'OhMunchy_',
            "display-name": 'OhMunchy_',
            "badges-raw": null,
            "badges": {},
            "color": "#ff0000"
        },
        message: "when are we playing furry simulator ????"
    },
    {
        userstate: {
            "username": 'fiszhh',
            "display-name": 'fiszhh',
            "badges-raw": "broadcaster/1,twitch-recap-2024/1",
            "badges": {},
            "color": "#ffb3ff"
        },
        message: "Alright"
    },
    {
        userstate: {
            "username": 'de_palace',
            "display-name": 'de_palace',
            "badges-raw": "subscriber/3,chatter-cs-go-2022/1",
            "badges": {},
            "color": "#1dee8b"
        },
        message: "!vanish"
    },
    {
        userstate: {
            "username": 'ftk789',
            "display-name": 'ftk789',
            "badges-raw": null,
            "badges": {},
            "color": "#8A3DE2"
        },
        message: "Thats a real jammer ShoulderDance RaveTime"
    },
    {
        userstate: {
            "username": 'strayyzz',
            "display-name": 'strayyzz',
            "badges-raw": "moderator/1,subscriber/3003",
            "badges": {},
            "color": "#00FF7F"
        },
        message: "Piss is not boobs or butt Wisdom"
    },
    {
        userstate: {
            "username": 'jolong66',
            "display-name": 'jolong66',
            "badges-raw": "vip/1,subscriber/0,sub-gift-leader/3",
            "badges": {},
            "color": "#FF69B4"
        },
        message: "aga life is like a box of chocolate, you never know when im gonna eat them all catEat"
    },
    {
        userstate: {
            "username": 'university_1',
            "display-name": 'university_1',
            "badges-raw": "subscriber/2,bits/100",
            "badges": {},
            "color": undefined
        },
        message: "Pog chat overlay with better zero width emotes catJAM WideRaveTime ALERT"
    }
]

const logoElements = document.getElementsByClassName('logo');
if (logoElements) {
    const intervalTime = 3000;
    let lastImageIndex = -1;

    function changeImage() {
        if (logoElements && logoElements[0]) {
            const logo = logoElements[0];
            let randomIndex;

            do {
                randomIndex = Math.floor(Math.random() * images.length);
            } while (randomIndex === lastImageIndex);

            logo.style.transition = 'opacity 0.5s ease-in-out';
            logo.style.opacity = 0;

            setTimeout(() => {
                logo.src = images[randomIndex];
                logo.style.opacity = 1;

                lastImageIndex = randomIndex;
            }, 500);
        }
    }

    setInterval(changeImage, intervalTime);
}

async function getImages() {
    const response = await fetch(`https://7tv.io/v3/emote-sets/01JC6TW7DYGXY01896S0VB34MF`);

    if (response.ok) {
        const data = await response.json();
        if (data.emotes) {
            images = data.emotes.map(emote => {
                const emote4x = emote.data.host.files.find(file => file.name === "4x.avif")
                    || emote.data.host.files.find(file => file.name === "3x.avif")
                    || emote.data.host.files.find(file => file.name === "2x.avif")
                    || emote.data.host.files.find(file => file.name === "1x.avif");

                return `https://cdn.7tv.app/emote/${emote.id}/${emote4x?.name || "1x.avif"}`;
            });
        }
    }
}

async function displayPreview() {
    if (!urlDiv) { return; }

    const url = urlDiv.textContent.trim();
    const current_url_split = url.split('/');

    settings = {
        channel: "twitch"
    };

    let settings_url = current_url_split[current_url_split.length - 1].split("?")

    settings_url.forEach(item => {
        const parts = item.split('=');

        if (parts.length === 2) {
            const key = parts[0].trim();
            const value = decodeURIComponent(parts[1].trim());

            if (["userBL", "prefixBL"].includes(String(key))) {
                const parts = String(value).split(' ');

                settings[key] = parts;
            } else {
                settings[key] = value;
            }
        }
    });

    console.log(settings)

    chatDisplay.innerHTML = '';

    PreviewMessages.forEach(message => {
        if (handleMessage) {
            handleMessage(message.userstate, message.message)
        }
    });
}

async function fixChatPreview() {
    if (settings.font) {
        chatDisplay.style.fontFamily = `"${settings.font}", "Inter"`;
    } else {
        chatDisplay.style.fontFamily = "Inter";
    }

    if (settings.fontShadow) {
        chatDisplay.style.filter = `drop-shadow(${settings.fontStroke} ${settings.fontStroke} 0.2rem black)`;
    } else {
        chatDisplay.style.filter = '';
    }

    if (settings.fontSize) {
        chatDisplay.style.fontSize = `${settings.fontSize}px`;
        desiredHeight = Number(settings.fontSize)
    } else {
        chatDisplay.style.fontSize = `36px`;
        desiredHeight = 36;
    }

    if (settings.emoteSize) {
        desiredHeight = Number(settings.emoteSize)
    } else {
        desiredHeight = 36;
    }

    if (settings && settings.fontStroke && String(settings.fontStroke) === "1") {
        chatDisplay.style.textShadow =
            '-1px -1px 0 black, ' +
            '1px -1px 0 black, ' +
            '-1px 1px 0 black, ' +
            '1px 1px 0 black';
    } else {
        chatDisplay.style.textShadow = "";
    }
    
    shadow_style.textContent = `#ChatDisplay > * {
        filter: drop-shadow(3px 3px 0rem rgba(0, 0, 0, ${Math.max(0, Math.min(1, Number((settings.fontShadow || 4) / 10)))}));
    }`;

    const style = document.createElement('style');
    style.textContent = `
        .twemoji {
            width: ${desiredHeight}px !important;
            height: ${desiredHeight}px !important;
            max-width: ${desiredHeight}px;
            max-height: ${desiredHeight}px;
            display: inline-block;
            vertical-align: middle;
            line-height: normal;
        }
    `;
}

async function waitForFunction(funcName) {
    while (typeof window[funcName] !== 'function') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

function checkUrlChange() {
    const currentUrl = urlDiv.textContent.trim();
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        displayPreview();
        fixChatPreview();
    }
}

async function setUpPreview() {
    settings = {
        channel: "twitch"
    };

    await waitForFunction('fetch7TVEmoteData');

    SevenTVEmoteData = await fetch7TVEmoteData('01JGAC1F503T2852YKXC8G9VN1');

    await getBadges();

    displayPreview();
    fixChatPreview();
    setInterval(checkUrlChange, 100);
}

button.addEventListener("click", () => {
    if (isWhite) {
        chatDisplay.style.backgroundColor = "rgba(255, 255, 255, 0.027)";
    } else {
        chatDisplay.style.backgroundColor = "white";
    }
    isWhite = !isWhite;
});

setUpPreview();
getImages();