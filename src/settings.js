const url = window.location.href;
const current_url_split = url.split('/')
let load = 'main'
let settings = {};

let desiredHeight = 36;

if (current_url_split.length > 0 && current_url_split[current_url_split.length - 1] && current_url_split[current_url_split.length - 1].includes('?')) {
    const settings = current_url_split[current_url_split.length - 1].split("?")

    console.log(settings)

    if (settings.find(setting => setting.includes("channel="))) {
        load = "chat"
    }
}

function appendScript(src) {
    const script = document.createElement('script');
    script.src = src;

    document.body.appendChild(script);
}

if (load === "chat") {
    var chatDiv = document.createElement('div');

    chatDiv.id = 'ChatDisplay';
    chatDiv.className = 'chat-messages';

    document.body.appendChild(chatDiv);

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

    const container = document.querySelector('.container');
    const logo = document.querySelector('.logo-container');
    const footer = document.querySelector('footer');

    if (container) {
        container.remove()
    }

    if (logo) {
        logo.remove()
    }

    if (footer) {
        footer.remove()
    }

    const scripts = document.querySelectorAll('script');

    scripts.forEach(script => {
        if (!script.hasAttribute('src')) {
            script.remove();
        }
    });

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'main/chatStyle.css';

    document.head.appendChild(link);

    appendScript('src/thirdParty/7TV.js')
    appendScript('src/thirdParty/SevenTVCosmetics.js')
    appendScript('src/thirdParty/SevenTVHelperV2.js')
    appendScript('src/thirdParty/BTTV.js')
    appendScript('src/thirdParty/FFZ.js')

    // MAIN INDEX
    appendScript('src/chatIndex.js')

    //UPDATE DETECTOR
    appendScript('src/detectUpdate.js')

    if (settings.font) {
        document.body.style.fontFamily = `"${settings.font}", "Inter"`;
    }

    if (!settings.fontShadow || String(settings.fontShadow) !== "0") {
        var shadow_style = document.createElement('style');

        var shadow_css = `#ChatDisplay > * {
                        filter: drop-shadow(3px 3px 0rem rgba(0, 0, 0, ${Math.max(0, Math.min(1, Number((settings.fontShadow || 4) / 10)))}));
                    }`;

        shadow_style.appendChild(document.createTextNode(shadow_css));
        document.head.appendChild(shadow_style);
    }

    if (settings.fontSize) {
        document.body.style.fontSize = `${settings.fontSize}px`;
        desiredHeight = Number(settings.fontSize)
    }

    if (settings.emoteSize) {
        desiredHeight = Number(settings.emoteSize)
    }

    if (settings && settings.fontStroke && String(settings.fontStroke) === "1") {
        document.body.style.textShadow =
            '-1px -1px 0 black, ' +
            '1px -1px 0 black, ' +
            '-1px 1px 0 black, ' +
            '1px 1px 0 black';
    }

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

    document.head.appendChild(style);
} else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'main/styles.css';

    document.head.appendChild(link);

    const link1 = document.createElement('link');
    link1.rel = 'stylesheet';
    link1.href = 'main/chatStyle.css';

    document.head.appendChild(link1);

    appendScript('src/landingPage/settngs.js')
    appendScript('src/landingPage/index.js')

    // NEEDED FOR CHAT PREVIEW

    // CHAT INDEX
    appendScript('src/chatIndex.js')

    appendScript('src/thirdParty/7TV.js')
}