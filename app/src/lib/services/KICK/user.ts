import { badges, globals } from "$stores/global";

type Badge = {
    id: number;
    channel_id: number;
    months: number;
    badge_image: {
        srcset: string;
        src: string;
    };
}[];

export async function getKickUser(name: string): Promise<boolean> {
    try {
        const res = await fetch("https://kick.com/api/v2/channels/" + name);

        if (!res.ok) return false;

        const data = await res.json();

        globals["channels"]["KICK"]["Name"] = data?.user?.username || null;
        globals["channels"]["KICK"]["userID"] = data?.user_id || null;
        globals["channels"]["KICK"]["channelID"] =
            data?.chatroom?.channel_id || null;
        globals["channels"]["KICK"]["chatroomID"] = data?.chatroom?.id || null;

        // CHANNEL BADGES
        const broadcastBadges: Badge | [] = data["subscriber_badges"];
        try {
            badges.update((badgeData) => {
                badgeData["KICK"] = broadcastBadges.map((badge) => ({
                    url: badge["badge_image"]["src"],
                    id: badge["id"],
                    months: badge["months"],
                    alt: String(badge["months"]),
                }));

                return badgeData;
            });
        } catch (err) {
            console.error("Error loading channel badges:", err);
        }

        return true;
    } catch (err) {
        return false;
    }
}
