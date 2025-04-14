const tweemojiStyle = document.createElement('style');
document.head.appendChild(tweemojiStyle);

const EmoteStyle = document.createElement('style');
document.head.appendChild(EmoteStyle);

const ShadowStyle = document.createElement('style');
document.head.appendChild(ShadowStyle);

desiredHeight = 25;

function appendSettings(applyElement) {
    if (!applyElement) { return; };

    if (settings.font) {
        applyElement.style.fontFamily = `"${settings.font}", "Inter"`;
    } else {
        applyElement.style.fontFamily = "Inter";
    }

    if (!settings.fontShadow || String(settings.fontShadow) !== "0") {
        const shadow_css = `#ChatDisplay > * {
                        filter: drop-shadow(3px 3px 0rem rgba(0, 0, 0, ${Math.max(0, Math.min(1, Number((settings.fontShadow || 4) / 10)))}));
                    }`;

        ShadowStyle.appendChild(document.createTextNode(shadow_css));
    }

    if (settings.fontSize) {
        applyElement.style.fontSize = `${settings.fontSize}px`;
        desiredHeight = Number(settings.fontSize);
    } else {
        applyElement.style.fontSize = `20px`;
    }

    if (settings.emoteSize) {
        desiredHeight = Number(settings.emoteSize);
    } else {
        desiredHeight = 25;
    }

    EmoteStyle.textContent = `
        .emote-wrapper {
            min-height: ${desiredHeight}px;
        }
        .emote {
            min-height: 5px;
            max-height: ${desiredHeight}px;
        }
    `;
    
    if (settings && settings.fontStroke && String(settings.fontStroke) === "1") {
        applyElement.style.webkitTextStroke = '1.3px black';
    } else {
        applyElement.style.webkitTextStroke = '';
    }

    tweemojiStyle.textContent = `
        .twemoji {
            height: 100vh !important;
            display: inline-block;
            vertical-align: middle;
            line-height: normal;
        }
    `;
}
