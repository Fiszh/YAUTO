<script lang="ts">
    import { cleanUpSharedChat } from "$lib/overlayIndex";
    import { getChannelEmotesViaTwitchID } from "$lib/emotes/main";
    import MessageWrapper from "../messageWrapper.svelte";
    import { onMount, type ComponentProps } from "svelte";
    import { globals } from "$stores/global";

    let { ...rest }: ComponentProps<typeof MessageWrapper> = $props();

    onMount(() => {
        if (rest["room_id"]) {
            if (
                String(rest["room_id"]) != globals["channels"]["TWITCH"]["ID"]
            ) {
                getChannelEmotesViaTwitchID(String(rest["room_id"]));
            } else if (
                !rest["tags"]["source-room-id"] &&
                String(rest["room_id"]) == globals["channels"]["TWITCH"]["ID"]
            ) {
                cleanUpSharedChat();
            }
        }
    });
</script>

<MessageWrapper {...rest} />
