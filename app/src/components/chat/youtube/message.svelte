<script lang="ts">
    import MessageWrapper from "../messageWrapper.svelte";
    import type { ComponentProps } from "svelte";
    import { YTNodes } from "youtubei.js";

    type WrapperProps = ComponentProps<typeof MessageWrapper>;
    type Props = Omit<WrapperProps, "tags"> & {
        tags: YTNodes.LiveChatTextMessage;
    };

    let { tags, ...rest }: Props = $props();

    const userstate: WrapperProps["tags"] = $derived({
        ...tags,
        "source-room-id": String(0),
        "user-id-raw": tags.author.id,
        "user-id": tags.author.id,
        username: tags.author.name,
        badges: tags.author.badges,
    });
</script>

<MessageWrapper
    {...rest}
    tags={userstate}
    user={tags.author.name.replace("@", "")}
    text={tags["message"]["runs"]
        ? tags["message"]["runs"]?.map((r) => r["text"]).join(" ")
        : (tags["message"]["text"] ?? "")}
/>
