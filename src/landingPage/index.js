const urlDiv = document.getElementById("url-results");
let lastUrl = urlDiv.textContent.trim();

const saveButton = document.getElementById("saveSettings-button");
const deleteButton = document.getElementById("deleteSettings-button");

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
            "username": 'uniiDev',
            "display-name": 'uniiDev',
            "user-id": "528761326",
            "badges-raw": "broadcaster/1,twitch-recap-2024/1",
            "badges": {},
            "color": "#ffb3ff",
            "source-room-id": "preview"
        },
        message: "Alright"
    },
    {
        userstate: {
            "username": 'de_palace',
            "display-name": 'de_palace',
            "badges-raw": null,
            "badges": {},
            "color": "#1dee8b",
            "source-room-id": "preview"
        },
        message: "!vanish"
    },
    {
        userstate: {
            "username": 'ftk789',
            "display-name": 'ftk789',
            "user-id": "166427338",
            "badges-raw": "subscriber/3,chatter-cs-go-2022/1",
            "badges": {},
            "color": "#8A3DE2",
            "source-room-id": "preview"
        },
        message: "Thats a real jammer ShoulderDance RaveTime"
    },
    {
        userstate: {
            "username": 'strayyzz',
            "display-name": 'strayyzz',
            "badges-raw": "moderator/1,subscriber/3003",
            "badges": {},
            "color": "#00FF7F",
            "source-room-id": "preview"
        },
        message: "Piss is not boobs or butt Wisdom"
    },
    {
        userstate: {
            "username": 'jolong66',
            "display-name": 'jolong66',
            "badges-raw": "vip/1,subscriber/0,sub-gift-leader/3",
            "badges": {},
            "color": "#FF69B4",
            "source-room-id": "preview"
        },
        message: "aga life is like a box of chocolate, you never know when im gonna eat them all catEat"
    },
    {
        userstate: {
            "username": 'university_1',
            "display-name": 'university_1',
            "badges-raw": "subscriber/2,bits/100",
            "badges": {},
            "color": undefined,
            "source-room-id": "preview"
        },
        message: "Pog chat overlay with better zero width emotes catJAM WideRaveTime ALERT"
    },
    {
        userstate: {
            "username": 'sonku___',
            "display-name": 'sonku___',
            "badges-raw": "bits/1250000,sub-gift-leader/1",
            "badges": {},
            "color": "#433E43",
            "source-room-id": "preview"
        },
        message: "@uniiDev, who the hell is FISzhh wtf 🤔"
    }
]

const logoElements = document.getElementsByClassName('logo');
window.onload = () => {
    if (logoElements.length) {
        const intervalTime = 3000;
        let lastImageIndex = -1;

        const preloadedImages = [];
        for (let i = 0; i < images.length; i++) {
            const img = new Image();
            img.src = images[i];
            preloadedImages.push(img);
        }

        function changeImage() {
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

        setInterval(changeImage, intervalTime);
    }
};

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
    if (!urlDiv) { return; };

    Object.entries(settings).forEach(([key, value]) => {
        if (["userBL", "prefixBL"].includes(String(key))) {
            const parts = String(value).split(' ');

            settings[key] = parts;
        } else {
            settings[key] = value;
        }
    });

    console.log(settings);

    chatDisplay.innerHTML = '';

    PreviewMessages.forEach(message => {
        if (handleMessage) {
            handleMessage(message.userstate, message.message)
        }
    });
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
        appendSettings(chatDisplay);
    }
}

async function setUpPreview() {
    await waitForFunction('fetch7TVEmoteData');

    SevenTVEmoteData["preview"] = await fetch7TVEmoteData('01JGAC1F503T2852YKXC8G9VN1');

    await getBadges();

    displayPreview();
    appendSettings(chatDisplay);
    setInterval(checkUrlChange, 100);
}

//NEEDED FOR PREVIEW
async function getBadges() {
    const response = await fetch(`https://api.ivr.fi/v2/twitch/badges/global`, {
        headers: {
            accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    data.forEach(element => {
        if (element["versions"]) {
            if (element && Object.keys(element).length) {
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

setUpPreview();
getImages();

saveButton.addEventListener("click", async () => {
    if (!userToken) {
        alert("You are not logged in");
        return;
    }

    if (!Object.keys(settings).length) {
        alert("No settings changed");
        return;
    }

    const saveSettings_response = await fetch("https://api.unii.dev/settings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken
        },
        body: JSON.stringify(settings)
    });

    if (!saveSettings_response.ok) {
        alert("There was a error saving your settings");
    } else {
        const saveSettings_data = await saveSettings_response.json();

        if (!saveSettings_data) {
            alert("No data recived from the server!");
        } else {
            alert(saveSettings_data["message"] || saveSettings_data["error"]);
        }
    }
})

deleteButton.addEventListener("click", async () => {
    if (!userToken) {
        alert("You are not logged in");
        return;
    }

    const deleteSettings_response = await fetch("https://api.unii.dev/settings", {
        method: "DELETE",
        headers: {
            "x-auth-token": userToken
        }
    });

    if (!deleteSettings_response.ok) {
        alert("There was a error saving your settings");
    } else {
        const deleteSettings_data = await deleteSettings_response.json();

        if (!deleteSettings_data) {
            alert("No data recived from the server!");
        } else {
            alert(deleteSettings_data["message"] || deleteSettings_data["error"]);
        }
    }
})