// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    const __COMMIT_HASH: string;
    const __BUILD_DATE: string;
    const __REPO_URL: string;
    const __APP_VERSION: string;
    const __DEBUG__: boolean;

    type Platforms = "TWITCH" | "KICK" | "GOOGLE";

    interface Window {
        obsstudio?: boolean;
    }

    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }

    interface Badge {
        id: string;
        title: string;
        name?: string;
        color?: string;
        tooltip?: string;
        urls: ScaleUrls[];
        url: string;
        owner?: any[];
    }

    interface parsedBadge {
        badge_url: string;
        alt: string;
        background_color?: string;
    }

    interface SevenTVBadge {
        id: string;
        name: string;
        tooltip: any;
        owner: Types7TV.Connection[];
        urls: any;
    }

    interface Paint {
        id: string;
        name: string;
        style: any;
        shape: any;
        backgroundImage: any;
        shadows: string | null;
        KIND: string;
        owner: Types7TV.Connection[];
        url: string;
    }

    interface ParsedEmotesUrls {
        scale: string;
        url: string;
        width: number;
        height: number;
        format?: string;
    }

    interface ParsedEmoteBase {
        name: string;
        original_name: string;
        emote_id: string;
        flags: number;
        set: string;
    }

    interface ParsedEmoteSingle extends ParsedEmoteBase {
        url: string;
        urls?: never;
    }

    interface ParsedEmoteMultiple extends ParsedEmoteBase {
        urls: ParsedEmotesUrls[];
        url?: never;
    }

    type ParsedEmote = ParsedEmoteSingle | ParsedEmoteMultiple;

    interface SavedSevenTVSet {
        id: string;
        owners: Types7TV.ConnectionWithID[];
        emotes: ParsedEmote[];
    }

    type StatusMessage = {
        type: "issues" | "outage" | "annoucement" | "resolved" | "fail";
        message?: string;
        href?: string;
        since?: number;
        till?: number;
    };
}

export {};
