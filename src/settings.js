const current_url = window.location.href;
const current_url_split = current_url.split('/')
let load = 'main'

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

let settings = {}

if (load === "chat") {
    let settings_url = current_url_split[current_url_split.length - 1].split("?")

    settings_url.forEach(item => {
        const parts = item.split('=');
        
        if (parts.length === 2) {
            const key = parts[0].trim();
            const value = parts[1].trim();
            settings[key] = value;
        }
    });

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
    appendScript('src/thirdParty/7TVUser.js')
    appendScript('src/thirdParty/BTTV.js')
    appendScript('src/thirdParty/FFZ.js')

    // MAIN INDEX
    appendScript('src/chatIndex.js')
} else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'main/styles.css';

    document.head.appendChild(link);
}