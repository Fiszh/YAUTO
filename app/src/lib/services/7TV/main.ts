interface Emote {
    id: string;
    name: string;
    data: {
        name: string;
        listed: boolean;
        flags?: any;
        host: {
            url: string;
            files: {
                name: string;
                width: number;
                height: number;
                format: string;
            }[];
        };
        owner?: { display_name?: string; username?: string };
    };
}

const parseSetData = (data: Emote[], emoteSet?: string): ParsedEmote[] =>
    data.map<ParsedEmote>((emote: Emote) => ({
        name: emote.name,
        original_name: emote.data.name,
        emote_id: emote.id,
        flags: emote.data.flags,
        urls: emote.data.host.files.map<ParsedEmotesUrls>((file) => ({
            scale: file.name.split(".")[0],
            url: `https://cdn.7tv.app/emote/${emote.id}/${file.name}`,
            width: file.width,
            height: file.height,
            format: file.format,
        })),
        set: emoteSet === "global" ? "Global 7TV" : "7TV",
    }));

interface Stop {
    color: number;
    at: number;
}

interface Shadow {
    color: number;
    x_offset: number | string;
    y_offset: number | string;
    radius: number | string;
}

async function parsePaintData(paint_data: Record<string, any>): Promise<Paint> {
    const baseFunction = paint_data.repeat
        ? `repeating-${paint_data.function}`
        : paint_data.function;
    const gradientFunction = baseFunction?.toLowerCase().replace(/_/g, "-");
    const hasStops = paint_data.stops?.length > 0;
    const isLinear = ["linear-gradient", "repeating-linear-gradient"].includes(
        gradientFunction,
    );

    let gradient = "";
    if (hasStops) {
        const normalized = paint_data.stops
            .map((stop: Stop) => `${argbToRgba(stop.color)} ${stop.at * 100}%`)
            .join(", ");

        const direction = isLinear
            ? `${paint_data.angle}deg`
            : paint_data.shape;
        gradient = `${gradientFunction}(${direction}, ${normalized})`;
    }

    const paint_message: Paint = {
        id: paint_data.id,
        name: paint_data.name,
        style: gradientFunction,
        shape: paint_data.shape,
        backgroundImage: hasStops ? gradient : `url('${paint_data.image_url}')`,
        shadows: null,
        KIND: hasStops ? "non-animated" : "animated",
        owner: [],
        url: paint_data.image_url,
    };

    if (paint_data.shadows?.length) {
        const shadows = await Promise.all(
            paint_data.shadows.map((s: Shadow) => {
                let rgbaColor = argbToRgba(s.color);
                rgbaColor = rgbaColor.replace(
                    /rgba\((\d+), (\d+), (\d+), (\d+(\.\d+)?)\)/,
                    "rgba($1, $2, $3)",
                );
                return `drop-shadow(${rgbaColor} ${s.x_offset}px ${s.y_offset}px ${s.radius}px)`;
            }),
        );

        paint_message.shadows = shadows.length ? shadows.join(" ") : null;
    }

    return paint_message;
}

interface File {
    name: string;
    format: string;
}

function parseBadgeData(badge_data: Record<string, any>): SevenTVBadge {
    const hosts = badge_data.host;

    const urls = (hosts?.files || [])
        .filter((file: File) => file.format === hosts.files?.[0]?.format)
        .map((file: File) => ({
            url: `https:${hosts.url}/${file.name}`,
            scale: file.name.replace(/\.[^/.]+$/, "").toLowerCase(),
        }));

    return {
        id: badge_data.id,
        name: badge_data.name,
        tooltip: badge_data.tooltip,
        owner: [],
        urls,
    };
}

async function emoteSetViaSetID(emoteSetId: string) {
    let emote_data: ParsedEmote[] = [];

    try {
        const response = await fetch(
            `https://7tv.io/v3/emote-sets/${emoteSetId}`,
        );

        if (response.ok) {
            const data = await response.json();

            if (data.emotes)
                emote_data = await parseSetData(data.emotes, emoteSetId);
        }
    } catch (error) {
        throw new Error(`Error fetching emote data: ${error}`);
    } finally {
        return emote_data;
    }
}

const getEmotes = async (emotes: Emote[] | null, set_id: string) =>
    emotes ? await parseSetData(emotes) : await emoteSetViaSetID(set_id);

type SetData = SavedSevenTVSet | Record<never, never>;

async function emoteSetViaTwitchID(
    twitchID: string | number,
): Promise<SetData> {
    let set_data: SetData = {};

    try {
        const response = await fetch(
            `https://7tv.io/v3/users/twitch/${twitchID}`,
        );

        if (response.ok) {
            const data = await response.json();

            if (data?.emote_set?.emotes)
                set_data = {
                    id: data["emote_set_id"],
                    user_id: data["user"]["id"],
                    emotes: await getEmotes(
                        data.emote_set.emotes,
                        data["emote_set_id"],
                    ),
                };
        }
    } catch (error) {
        throw new Error(`Error fetching emote data: ${error}`);
    } finally {
        return set_data;
    }
}

async function emoteSetViaKickID(twitchID: string | number): Promise<SetData> {
    let set_data: SetData = {};

    try {
        const response = await fetch(
            `https://7tv.io/v3/users/kick/${twitchID}`,
        );

        if (response.ok) {
            const data = await response.json();

            if (data?.emote_set?.emotes)
                set_data = {
                    id: data["emote_set_id"],
                    user_id: data["user"]["id"],
                    emotes: await getEmotes(
                        data.emote_set.emotes,
                        data["emote_set_id"],
                    ),
                };
        }
    } catch (error) {
        throw new Error(`Error fetching emote data: ${error}`);
    } finally {
        return set_data;
    }
}

async function emoteSetViaYouTubeID(youtubeID: string): Promise<SetData> {
    let set_data: SetData = {};

    try {
        const response = await fetch(
            `https://7tv.io/v3/users/google/${youtubeID}`,
        );

        if (response.ok) {
            const data = await response.json();

            if (data?.emote_set?.emotes)
                set_data = {
                    id: data["emote_set_id"],
                    user_id: data["user"]["id"],
                    emotes: await getEmotes(
                        data.emote_set.emotes,
                        data["emote_set_id"],
                    ),
                };
        }
    } catch (error) {
        throw new Error(`Error fetching emote data: ${error}`);
    } finally {
        return set_data;
    }
}

const parseUserInfo = async (
    data: Record<string, any>,
): Promise<Types7TV.UserInfo> => {
    const user_data = data.user;

    return {
        id: user_data.id,
        username: user_data.username,
        display_name: user_data.display_name,
        avatar_url: user_data.avatar_url,
        emote_set_id: data.emote_set_id,
        emote_data: await getEmotes(
            data.emote_set.emotes,
            data["emote_set_id"],
        ),
        connections: user_data.connections.map((c: Types7TV.Connection) => ({
            ...c,
            user_id: user_data.id,
        })),
        service: {
            id: data.id,
            username: data.username,
            display_name: data.display_name,
        },
    };
};

interface UserInfoInvalid {
    id: null;
}

async function getUserViaTwitchID(
    twitchID: string | number,
): Promise<Types7TV.UserInfo | UserInfoInvalid> {
    let user_info: Types7TV.UserInfo | UserInfoInvalid = {
        id: null,
    };

    try {
        const response = await fetch(
            `https://7tv.io/v3/users/twitch/${twitchID}`,
        );

        if (response.ok) {
            const data = await response.json();

            if (data?.user) user_info = await parseUserInfo(data);
        }
    } catch (error) {
        throw new Error(`Error fetching user data: ${error}`);
    } finally {
        return user_info;
    }
}

async function getUserViaKickID(
    kickID: string | number,
): Promise<Types7TV.UserInfo | UserInfoInvalid> {
    let user_info: Types7TV.UserInfo | UserInfoInvalid = {
        id: null,
    };

    try {
        const response = await fetch(`https://7tv.io/v3/users/kick/${kickID}`);

        if (response.ok) {
            const data = await response.json();

            if (data?.user) user_info = await parseUserInfo(data);
        }
    } catch (error) {
        throw new Error(`Error fetching user data: ${error}`);
    } finally {
        return user_info;
    }
}

async function getUserViaYouTubeID(
    youtubeID: string,
): Promise<Types7TV.UserInfo | UserInfoInvalid> {
    let user_info: Types7TV.UserInfo | UserInfoInvalid = {
        id: null,
    };

    try {
        const response = await fetch(
            `https://7tv.io/v3/users/google/${youtubeID}`,
        );

        if (response.ok) {
            const data = await response.json();

            if (data?.user) user_info = await parseUserInfo(data);
        }
    } catch (error) {
        throw new Error(`Error fetching user data: ${error}`);
    } finally {
        return user_info;
    }
}

async function getUserVia7TVID(stvID: string | number) {
    let user_info: Types7TV.UserInfo | UserInfoInvalid = {
        id: null,
    };

    try {
        const response = await fetch(`https://7tv.io/v3/users/${stvID}`);

        if (response.ok) {
            const data = await response.json();

            if (data?.user) user_info = await parseUserInfo(data);
        }
    } catch (error) {
        throw new Error(`Error fetching user data: ${error}`);
    } finally {
        return user_info;
    }
}

function argbToRgba(color: number) {
    if (color < 0) color = color >>> 0;

    const red = (color >> 24) & 0xff;
    const green = (color >> 16) & 0xff;
    const blue = (color >> 8) & 0xff;
    return `rgba(${red}, ${green}, ${blue}, 1)`;
}

export default {
    parseSetData,
    parsePaintData,
    parseBadgeData,
    user: {
        by7TVID: getUserVia7TVID,
        byTwitchID: getUserViaTwitchID,
        byKickID: getUserViaKickID,
        byYouTubeID: getUserViaYouTubeID,
    },
    emoteSet: {
        bySetID: emoteSetViaSetID,
        byTwitchID: emoteSetViaTwitchID,
        byKickID: emoteSetViaKickID,
        byYouTubeID: emoteSetViaYouTubeID,
    },
};
