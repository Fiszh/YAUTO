const settingsDiv = document.getElementById("configuration");
const ChatDisplay = document.getElementById("ChatDisplay");
const url_results = document.getElementById("url-results");
const channel_input = document.getElementById("channel-input");

let defaultConfig_path = 'src/landingPage/defaultConfig.json';
let defaultConfig = {};

// LOAD DEFAULT CONFIGURATION
(async () => {
    try {
        const response = await fetch(defaultConfig_path);

        if (!response.ok) {
            throw new Error("Failed to load in defaultConfig.json");
        }

        const data = await response.json();

        if (!data || typeof data !== 'object') {
            throw new Error("defaultConfig.json is not a valid JSON object");
        }

        if (!Object.keys(data).length) {
            throw new Error("defaultConfig.json was loaded but it seems to be empty");
        }

        defaultConfig = data;
    } catch (err) {
        settingsDiv.innerHTML = `Failed to load in defaultConfig.json, please try reloading the page. <br> Error: ${err.message}`;

        return;
    } finally {
        displaySettings();
    };
})();

function displaySettings() {
    if (!Object.keys(settings)) { return; };
    settingsDiv.innerHTML = "";

    for (const key in defaultConfig) {
        const setting = defaultConfig[key];

        const settingDiv = document.createElement('div');
        settingDiv.id = 'setting_item';
        settingDiv.classList = setting.type;

        const setting_name = document.createElement('div');
        setting_name.innerHTML = setting.name;

        let input;

        if (setting.type === "number" || setting.type === "text") {
            input = document.createElement('input');
            input.type = 'text';
            input.value = setting.value;

            input.addEventListener('input', () => {
                input.value = validateSettings(input.value, setting.type);

                settings[setting.param] = input.value;

                if (input.value === "") {
                    delete settings[setting.param];
                }

                appendSettings(ChatDisplay);

                updateUrl();
            });
        } else if (setting.type === "boolean") {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = setting.value;

            if (setting.value) {
                input.classList.add('active');
            } else {
                input.classList.remove('active');
            }

            input.addEventListener('change', () => {
                const checked = input.checked;

                settings[setting.param] = checked ? "1" : "0";

                if (checked) {
                    input.classList.add('active');
                } else {
                    input.classList.remove('active');
                }

                appendSettings(ChatDisplay);

                updateUrl();
            });
        }

        settingDiv.appendChild(setting_name);
        if (input) { settingDiv.appendChild(input); };
        settingsDiv.appendChild(settingDiv);
    }
}

channel_input.addEventListener('input', () => {
    let channel = channel_input.value.trim();
    channel = channel.replace(/[^\w]/g, '');

    channel_input.value = channel;

    if (channel) {
        settings.channel = channel;
    } else {
        delete settings.channel;
    }

    updateUrl();
});

url_results.addEventListener('click', () => {
    if (url_results.textContent) {
        if (settings.channel) {
            navigator.clipboard.writeText(url_results.textContent)
                .then(() => {
                    alert("Overlay URL has been copied!");
                })
                .catch(err => {
                    console.error("Failed to copy URL: ", err);
                });
        } else {
            alert("Channel name not provided!.");
        }
    }
});

function updateUrl() {
    if (updateUrl._timeout) { clearTimeout(updateUrl._timeout); }; // DEBOUNCE
    updateUrl._timeout = setTimeout(() => {
        const params = new URLSearchParams();

        if (settings.channel) {
            params.set('channel', settings.channel);
        }

        for (const [key, value] of Object.entries(settings)) {
            const foundSetting = Object.values(defaultConfig).find(setting => setting.param === key);
            if (foundSetting) {
                const settingValue = foundSetting.type === "boolean" ? (value === "1" ? true : false) : value;

                if (foundSetting.value !== settingValue) {
                    params.append(key, encodeURIComponent(value));
                }
            }
        }

        url_results.textContent = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    }, 100);
}

updateUrl();

const validateSettings = (input, type) => {
    if (type === "number") {
        const sanitized = input.replace(/[^0-9.\-]/g, '');
        return sanitized;
    }
    return input;
}