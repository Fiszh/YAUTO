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

getImages();