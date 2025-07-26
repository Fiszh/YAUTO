const settingsDiv = document.getElementById("configuration");
const ChatDisplay = document.getElementById("ChatDisplay");
const url_results = document.getElementById("url-results");
const channel_input = document.getElementById("channel-input");
const copyURLButton = document.getElementById("click_to_copy");
const reset_settings = document.getElementById("reset-settings");

let userSettings = {};

const storage = {
    save: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    get: (key) => {
        const item = localStorage.getItem(key);
        try {
            return JSON.parse(item);
        } catch {
            return item;
        }
    },
    remove: (key) => localStorage.removeItem(key),
};

let defaultConfig_path = 'src/landingPage/defaultConfig.json';
let defaultConfig = {};

let local_settings = storage.get('settings') || {};

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

    channel_input.value = settings.channel || "";

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
            input.placeholder = setting.value;

            input.value = local_settings[setting.param] ? local_settings[setting.param] : (userSettings[setting.param] ? userSettings[setting.param] : "");

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

            let isEnabled = local_settings[setting.param] ? Number(local_settings[setting.param]) : (userSettings[setting.param] ?  Number(userSettings[setting.param]) : "");

            input.checked = isEnabled;

            if (isEnabled) {
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

copyURLButton.addEventListener('click', () => {
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

function updateUrl(save_local = true) {
    if (updateUrl._timeout) { clearTimeout(updateUrl._timeout); }; // DEBOUNCE
    updateUrl._timeout = setTimeout(() => {
        let settings_to_save = {};

        const params = new URLSearchParams();

        if (settings.channel) {
            params.set('channel', settings.channel);
        }

        for (let [key, value] of Object.entries(settings)) {
            const foundSetting = Object.values(defaultConfig).find(setting => setting.param === key);
            if (foundSetting) {
                const settingValue = foundSetting.type === "boolean" ? (value === "1" ? true : false) : value;

                if (foundSetting.value !== settingValue) {
                    if (Array.isArray(value)) {
                        value = value.join(" ").replace(/,/g, " ");
                    } // REMOVE ARRAYS

                    params.append(key, value);

                    if (save_local && value !== userSettings?.[key]) {
                        settings_to_save[key] = value;
                    }
                }
            }
        }

        const paramString = params.toString().replace(/\+/g, '%20');

        url_results.textContent = `${window.location.origin}${window.location.pathname}${paramString.toString() ? '?' + paramString.toString() : ''}`;

        storage.save("settings", settings_to_save);
    }, 100);
}

url_results.textContent = `${window.location.origin}${window.location.pathname}`;

settings = { ...settings, ...local_settings };

updateUrl();
displaySettings();

reset_settings.addEventListener("click", () => {
    for (const [key, value] of Object.keys(local_settings)) {
        if (setting[key] == value) {
            delete setting[key];
        }
    }

    updateUrl(false);
    displaySettings();

    local_settings = {};

    storage.save("settings", {});
})

const validateSettings = (input, type) => {
    if (type === "number") {
        const sanitized = input.replace(/[^0-9.\-]/g, '');
        return sanitized;
    }
    return input;
}