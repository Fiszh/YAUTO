import { configs, settings } from "$stores/settings";
import { _ } from "svelte-i18n";
import { get } from "svelte/store";
import { flags } from "./bitmap";

const defaultJSON = {
    widgetName: "UChat Chat Overlay " + __APP_VERSION,
    widgetWidth: 400,
    widgetHeight: 600,
    headerTag: "",
    bodyTag: '<iframe id="chat" src="" allowtransparency="true"></iframe>',
    styleTag:
        "* {\n  margin: 0;\n  padding: 0;\n  border: 0;\n }\n\nhtml, body {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n }\n\n iframe {\n  width: 100%;\n  height: 100%;\n  border: none;\n  display: block;\n }",
    scriptTag:
        'const frame = document.getElementById("chat");\nlet timer;\nfunction format(key, value) {\n    if (Array.isArray(value)) return value.join(" ");\n    return value;\n}\nconst apply = () => {\n    const url = new URL("https://chat.unii.dev/");\n    for (const [key, value] of Object.entries(params)) {\n        const formatted = format(key, value);\n        if (formatted !== "") url.searchParams.set(key, formatted);\n    }\n    url.searchParams.set("pogly", "1");\n    frame.src = url;\n};\nfunction onLiveVariableUpdate(name, value) {\n    if (name !== "reload_chat") params[name] = value;\n    clearTimeout(timer);\n    timer = setTimeout(apply, 300);\n}\napply();',
    variables: [],
};

function generateDefaults() {
    return configs
        .map((s) => {
            if (!s["hide"]) {
                switch (s["type"]) {
                    case "text":
                        return {
                            variableName: s["param"],
                            variableType: 1,
                            variableValue: s["default"],
                            variableLive: true,
                            variableDescription: get(_)(
                                "settings.items." + s["param"] + ".description",
                            ),
                        };
                    case "slider":
                    case "number":
                        return {
                            variableName: s["param"],
                            variableType: 7,
                            variableValue: s["default"],
                            variableLive: true,
                            variableDescription: get(_)(
                                "settings.items." + s["param"] + ".description",
                            ),
                            variableMin: "min" in s ? Number(s["min"]) : 0,
                            variableMax: "max" in s ? Number(s["max"]) : 100,
                            variableStep: 1,
                        };
                    case "boolean":
                        return {
                            variableName: s["param"],
                            variableType: 2,
                            variableValue: s["default"],
                            variableLive: true,
                            variableDescription: get(_)(
                                "settings.items." + s["param"] + ".description",
                            ),
                        };
                    case "color-picker":
                        return {
                            variableName: s["param"],
                            variableType: 4,
                            variableValue: s["default"],
                            variableLive: true,
                            variableDescription: get(_)(
                                "settings.items." + s["param"] + ".description",
                            ),
                        };
                    case "selector":
                        return {
                            variableName: s["param"],
                            variableType: 12,
                            variableValue: s["selectors"]
                                .map((o) => {
                                    if (o["enabled"]) return o["label"];
                                })
                                .filter(Boolean),
                            variableLive: true,
                            variableDescription: get(_)(
                                "settings.items." + s["param"] + ".description",
                            ),
                            variableOptions: s["selectors"].map(
                                (o) => o["label"],
                            ),
                            variableListFormat: "json",
                        };
                    default:
                        break;
                }
            }
        })
        .filter(Boolean);
}

export function generatePoglyWidget() {
    let defaults = generateDefaults() as Exclude<
        ReturnType<typeof generateDefaults>[number],
        undefined
    >[];

    for (const s of get(settings)) {
        const foundConfig = defaults.find(
            (c) => c!["variableName"] == s["param"],
        );

        if (foundConfig && foundConfig["variableValue"] != s["value"]) {
            if (
                (s["type"] == "text" || s["type"] == "number") &&
                !s["value"].trim().length
            )
                continue;

            if (s["type"] == "selector") {
                const enabledSelectors = flags.getEnabled(
                    s["value"],
                    s["selectors"],
                ) as (ReturnType<typeof flags.getEnabled>[number] & {
                    label: string;
                })[];

                foundConfig["variableValue"] = enabledSelectors.map(
                    (sl) => sl["label"],
                );
            } else if (s["type"] == "dropdown") {
                foundConfig["variableValue"] = s["default"];
            } else {
                foundConfig["variableValue"] = s["value"];
            }
        }
    }

    defaults = [
        {
            variableName: "channel",
            variableType: 1,
            variableValue: "",
            variableLive: true,
            variableDescription:
                "Twitch channel login. Leave empty if using id.",
        },
        {
            variableName: "id",
            variableType: 1,
            variableValue: "",
            variableLive: true,
            variableDescription: "Twitch channel ID.",
        },
        {
            variableName: "kick",
            variableType: 1,
            variableValue: "",
            variableLive: true,
            variableDescription:
                "Kick channel name. Can run alongside a other channels.",
        },
        {
            variableName: "youtube",
            variableType: 1,
            variableValue: "",
            variableLive: true,
            variableDescription:
                "YouTube channel ID, not the handle. Can run alongside a other channels.",
        },
        ...defaults,
    ];

    const params = defaults.reduce<Record<string, string>>((acc, s) => {
        acc[s["variableName"]] = `{${s["variableName"]}}`;
        return acc;
    }, {});

    console.log(JSON.stringify(params));
    console.log(defaults);

    const finalJSON = {
        ...defaultJSON,
        scriptTag:
            "const params = " +
            `{ ${Object.entries(params)
                .map(([k, v]) => {
                    const foundConfig = configs.find((c) => c["param"] == k);

                    if (foundConfig && foundConfig["type"] == "selector")
                        return `${k}: '${v}'`;

                    return `${k}: "${v}"`;
                })
                .join(", ")} }` +
            ";\n " +
            defaultJSON["scriptTag"],
        variables: defaults,
    };

    console.log(finalJSON);

    return finalJSON;
}

export const isPogly = () =>
    typeof window != "undefined"
        ? new URL(window.location.href).searchParams.get("pogly") == "1"
        : false;
