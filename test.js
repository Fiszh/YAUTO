local_settings = {}
setting = {
    "name": "Message are in <strong>bold</strong> text",
    "type": "boolean",
    "value": true,
    "param": "msgBold"
}
userSettings = {}
settings = {
    "fontShadow": 4,
    "msgBold": "0"
}

let isEnabled = local_settings[setting.param] ? Number(local_settings[setting.param]) : (userSettings[setting.param] ? Number(userSettings[setting.param]) : (setting.value != settings?.[setting.param] && settings?.[setting.param] != undefined ? settings?.[setting.param] : setting.value));

console.log(isEnabled);