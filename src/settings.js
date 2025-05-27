const url = window.location.href;
const current_url_split = url.split('/')
let load = 'main'
let settings = {};

if (current_url_split.length && current_url_split[current_url_split.length - 1] && current_url_split[current_url_split.length - 1].includes('?')) {
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

    console.log(settings);

    document.title = `YAUTO Chat • ${settings.channel || "None"}`;

    document.body.innerHTML = `<div id="ChatDisplay" class="chat-messages"></div>`;
    
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

    appendScript('src/thirdParty/7TV.js');
    appendScript('src/thirdParty/SevenTVCosmetics.js');
    appendScript('src/thirdParty/SevenTVHelperV2.js');
    appendScript('src/thirdParty/BTTV.js');
    appendScript('src/thirdParty/FFZ.js');

    // MAIN INDEX
    appendScript('src/chatIndex.js');

    //UPDATE DETECTOR
    //appendScript('src/detectUpdate.js');

    // SETTINGS 
    appendSettings(document.getElementById("ChatDisplay"));
} else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'main/homepage.css';

    document.head.appendChild(link);

    const link1 = document.createElement('link');
    link1.rel = 'stylesheet';
    link1.href = 'main/chatStyle.css';

    document.head.appendChild(link1);

    appendScript('src/landingPage/settings.js');
    appendScript('src/landingPage/index.js');
    appendScript('src/landingPage/events.js');
    appendScript('src/landingPage/twitchLogin.js');

    // NEEDED FOR CHAT PREVIEW

    // CHAT INDEX
    appendScript('src/chatIndex.js');

    appendScript('src/thirdParty/7TV.js');

    // SETTINGS 
    appendSettings(document.getElementById("ChatDisplay"));
}