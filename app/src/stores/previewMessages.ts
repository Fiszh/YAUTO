export const previewMessages = [
    {
        tags: {
            username: "uniiDev",
            "display-name": "uniiDev",
            "user-id": 528761326,
            "badges-raw": "broadcaster/1,twitch-recap-2024/1",
            badges: { broadcaster: "1", "twitch-recap-2024": "1" },
            color: "#ffb3ff",
        },
        message: "Alright",
    },
    {
        tags: {
            username: "grimmmommy",
            "display-name": "grimmmommy",
            "user-id": 1165163489,
            "badges-raw": null,
            badges: {},
            color: "#B000BA",
        },
        message: "!vanish peepoVanish",
    },
    {
        tags: {
            username: "ftk789",
            "display-name": "ftk789",
            "user-id": 166427338,
            "badges-raw": "subscriber/3,chatter-cs-go-2022/1",
            badges: { subscriber: "3", "chatter-cs-go-2022": "1" },
            color: "#8A3DE2",
        },
        message: "Thats a real jammer ShoulderDance RaveTime",
    },
    // {
    //     tags: {
    //         username: "strayyzz",
    //         "display-name": "strayyzz",
    //         "user-id": 234567890,
    //         "badges-raw": "moderator/1,subscriber/3003",
    //         badges: { moderator: "1", subscriber: "3003" },
    //         color: "#00FF7F",
    //     },
    //     message: "Piss is not boobs or butt Wisdom",
    // },
    {
        tags: {
            username: "jolong66",
            "display-name": "jolong66",
            "user-id": 345678901,
            "badges-raw": "vip/1,subscriber/0,sub-gift-leader/3",
            badges: { vip: "1", subscriber: "0", "sub-gift-leader": "3" },
            color: "#FF69B4",
        },
        message:
            "aga life is like a box of chocolate, you never know when im gonna eat them all catEat",
    },
    {
        tags: {
            username: "university_1",
            "display-name": "university_1",
            "user-id": 456789012,
            "badges-raw": "bot-badge/1,subscriber/2,bits/100",
            badges: { "bot-badge": "1", subscriber: "2", bits: "100" },
            color: undefined,
        },
        message:
            Math.random() < 0.01
                ? "I am a robot and I like to dance and clap! kanyePls ALERT"
                : "Pog chat overlay with better zero width emotes catJAM WideRaveTime ALERT",
    },
    {
        tags: {
            username: "k1n_",
            "display-name": "K1N_",
            "user-id": 196937696,
            "badges-raw": "dragonscimmy/1",
            badges: { dragonscimmy: "1" },
            color: "#FF69B4",
        },
        message: "@uniiDev yugi61",
    },
    {
        tags: {
            username: "xslash58",
            "display-name": "Xslash58",
            "user-id": 198740595,
            "badges-raw": "destiny-2-the-final-shape-streamer/1",
            badges: { "destiny-2-the-final-shape-streamer": "1" },
            color: "#28A656",
        },
        message: "gżegżółka bah",
    },
    {
        tags: {
            username: "cascow_",
            "display-name": "cascoW_",
            "user-id": 143164700,
            "badges-raw": "bingbonglove/1",
            badges: { bingbonglove: "1" },
            color: "#00DDC0",
        },
        message: "I'm thinking Miku, Miku Ooh-ee-ooh",
    },
].map((m) => ({
    ...m,
    tags: {
        ...m.tags,
        "user-id-raw": String(m.tags["user-id"]),
        "room-id": "0",
    },
    service: "TWITCH",
}));
