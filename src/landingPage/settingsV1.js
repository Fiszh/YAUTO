const settingsDiv = document.getElementsByClassName("configuration")[0];
const url_results = document.getElementById('url-results');
const channel_input = document.getElementById('channel-input');

let currentUrl = document.location.href;

if (!currentUrl.endsWith('/')) {
    currentUrl += '/';
}

url_results.textContent = currentUrl;

const templates = {
    boolean: {
        name: 'template',
        type: 'boolean',
        value: false,
        param: 'template'
    },
    text: {
        name: 'template',
        type: 'text',
        value: "template",
        param: 'template'
    },
    number: {
        name: 'template',
        type: 'number',
        param: 'template',
        max: 1,
        min: 0,
        value: 1
    }
};

let defaultSettings = [];

async function displaySettings() {
    if (!settingsDiv) { return; }

    try {
        const response = await fetch(configuration_path);

        if (!response.ok) {
            throw new Error("Failed to load in configuration.json");
        }

        const data = await response.json();

        if (Object.keys(data).length < 1) {
            throw new Error("configuration.json was loaded but it seems to be empty");
        }

        configuration = data;
    } catch (err) {
        settingsDiv.innerHTML = `Failed to load in configuration.json, please try reloading the page. <br> Error: ${err.message}`;

        return;
    };

    // PROCEED WITH LOADING THE SETTINGS DISPLAY

    let i = 0;

    defaultSettings = Object.values(configuration).map(setting => {
        let value = setting.value;

        if (setting.type === 'text') {
            value = null;
        }

        return { [setting.param]: value };
    });

    for (const key in configuration) {
        const setting = configuration[key];
        if (setting.type === "number") {
            const numberSetting = document.createElement('div');
            numberSetting.className = 'setting_number';

            numberSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <input type="text" id="quantity-${i}" name="quantity" value="${setting.value}" min="${setting.min}" max="${setting.max}" step="1" oninput="validateInput(event)" autocomplete="off">
            `;

            settingsDiv.append(numberSetting);

            const numberInput = document.getElementById(`quantity-${i}`);

            numberInput.addEventListener('input', function (event) {
                const param = setting.param;

                const settingObject = defaultSettings.find(obj => obj[param] !== undefined);

                const defaultValue = settingObject[param];

                const input = event.target;
                const min = parseInt(input.min);
                const max = parseInt(input.max);

                input.value = input.value.replace(/[^0-9]/g, '');
                let value = parseInt(input.value) || 0;

                if (value < min) {
                    input.value = min;
                } else if (value > max) {
                    //input.value = max;
                }

                if (Number(input.value) === defaultValue || !input.value) {
                    url_results.textContent = url_results.textContent.replace(`?${setting.param}=${encodeURIComponent(String(setting.value))}`, '');
                } else if (url_results.textContent.includes(setting.param)) {
                    url_results.textContent = url_results.textContent.replace(`?${setting.param}=${encodeURIComponent(String(setting.value))}`, `?${setting.param}=${encodeURIComponent(input.value)}`);
                } else {
                    url_results.textContent = `${url_results.textContent}?${setting.param}=${encodeURIComponent(input.value)}`;
                }

                setting.value = Number(input.value);
            });

            i++;
        } else if (setting.type === "boolean") {
            const booleanSetting = document.createElement('div');
            booleanSetting.className = 'setting_boolean';

            isChecked = '';

            if (setting.value) {
                isChecked = " checked"
            }

            booleanSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <div class="toggle-container">
                    <input type="checkbox" id="toggle-${i}" class="toggle-input"${isChecked}>
                    <label for="toggle-${i}" class="toggle-label"></label>
                </div>
            `;

            settingsDiv.append(booleanSetting);

            const checkbox = document.getElementById(`toggle-${i}`);

            checkbox.addEventListener('change', function () {
                const param = setting.param;

                const settingObject = defaultSettings.find(obj => obj[param] !== undefined);

                const value = settingObject[param];

                if (checkbox.checked) {
                    setting.value = true

                    if (value === true) {
                        url_results.textContent = url_results.textContent.replace(`?${setting.param}=0`, '')
                    } else {
                        url_results.textContent = `${url_results.textContent}?${setting.param}=1`
                    }
                } else {
                    setting.value = false

                    if (value === false) {
                        url_results.textContent = url_results.textContent.replace(`?${setting.param}=1`, '')
                    } else {
                        url_results.textContent = `${url_results.textContent}?${setting.param}=0`
                    }
                }
            });

            i++;
        } else if (setting.type === "text") {
            const textSetting = document.createElement('div');
            textSetting.className = 'setting_text';

            textSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <input type="text" id="quantity-${i}" name="quantity" autocomplete="off" spellcheck="false" placeholder="${setting.value}">
            `;

            settingsDiv.append(textSetting);

            const textInput = document.getElementById(`quantity-${i}`);

            if (textInput) {
                textInput.addEventListener('input', function () {
                    if (setting.param === "font") {
                        const settingNameElement = textSetting.querySelector('.setting_name');
                        settingNameElement.style.fontFamily = `"${textInput.value}", "inter"`;
                    }

                    if (typeof url_results !== 'undefined') {
                        let currentUrl = url_results.textContent;

                        const encodedValue = encodeURIComponent(textInput.value);
                        const regex = new RegExp(`\\b${setting.param}=[^?]*`);

                        if (textInput.value === "" || !textInput.value) {
                            currentUrl = currentUrl.replace(regex, '').replace(/[?]$/, '');
                        } else if (currentUrl.match(regex)) {
                            currentUrl = currentUrl.replace(regex, `${setting.param}=${encodedValue}`);
                        } else {
                            currentUrl += `?${setting.param}=${encodedValue}`;
                        }

                        currentUrl = currentUrl.replace(/[?]$/, '');

                        url_results.textContent = currentUrl;
                    }

                    setting.value = textInput.value || "";
                });
            }

            i++;
        } else if (setting.type === "select") {
            const textSetting = document.createElement('div');
            textSetting.className = 'setting_select';

            let buttons_html = setting.options
                .map(option => {
                    i++;
                    return `<option value="${option}">${option}</option>`;
                })
                .join("");

            textSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <select id="quantity-${i}" name="quantity">
                    ${buttons_html}
                </select>
            `;

            settingsDiv.append(textSetting);
        }
    }
}

function validateInput(event) {
    const input = event.target;
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    input.value = input.value.replace(/[^0-9]/g, '');

    let value = parseInt(input.value) || 0;

    if (value < min) {
        input.value = min;
    } else if (value > max) {
        //input.value = max;
    }
}

url_results.addEventListener('click', function () {
    if (settings?.channel) {
        navigator.clipboard.writeText(url_results.textContent).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    } else {
        alert('Channel not provided!');
    }
});

if (channel_input) {
    channel_input.addEventListener('input', function () {
        if (typeof url_results !== 'undefined') {
            let currentUrl = url_results.textContent;

            const encodedValue = encodeURIComponent(channel_input.value);
            const regex = new RegExp(`\\bchannel=[^?]*`);

            if (channel_input.value === "" || !channel_input.value) {
                currentUrl = currentUrl.replace(regex, '').replace(/[?]$/, '');
            } else if (currentUrl.match(regex)) {
                currentUrl = currentUrl.replace(regex, `channel=${encodedValue}`);
            } else {
                currentUrl += `?channel=${encodedValue}`;
            }

            currentUrl = currentUrl.replace(/[?]$/, '');

            url_results.textContent = currentUrl;
        }
    });
}

// Load
displaySettings();