declare namespace EmoteParser {
    interface TwitchEmoteInfo {
        name: string;
        emote_id: string;
        url: string;
        site: "TTV";
    }

    interface YouTubeEmoteInfo extends TwitchEmoteInfo {
        site: "YT";
    }

    interface KickEmoteInfo {
        name: string;
        emote_id: string;
        url: string;
        site: "KICK";
    }

    interface FoundInfo {
        type: string;
    }

    interface FoundEmoteBase {
        overlapped?: (ParsedEmote & { overlap_index: number })[];
    }

    interface FoundEmote extends FoundInfo, FoundEmoteBase {
        type: "emote";
        emote: ParsedEmote | TwitchEmoteInfo | KickEmoteInfo | YouTubeEmoteInfo;
    }

    interface FoundEmoji extends FoundInfo, FoundEmoteBase {
        type: "emoji";
        emoji: {
            name: string;
            url: string;
        };
    }

    interface FoundBits extends FoundInfo, FoundEmoteBase {
        type: "bits";
        bits: {
            name: string;
            url: string;
            color: string;
            bits: number;
        };
    }

    interface FoundUser extends FoundInfo {
        type: "user";
        input: string;
        name: string;
        nameColor: string;
    }

    interface FoundOther extends FoundInfo {
        type: "other";
        part: string;
    }

    type FoundPart =
        FoundEmote | FoundEmoji | FoundBits | FoundUser | FoundOther;
}
