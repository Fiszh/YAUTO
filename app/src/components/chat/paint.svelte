<script lang="ts">
    import { getPaint, getPaintHTML } from "$lib/services/7TV/cosmetics";
    import { cosmetics } from "$stores/cosmetics";
    import { chatSettings } from "$stores/settings";
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    type Props = {
        platform: Types7TV.Connection["platform"];
        platformID: string;
        backgroundColor: string;
        children: Snippet;
    } & HTMLAttributes<HTMLSpanElement>;

    let {
        platform,
        platformID,
        backgroundColor,
        children,
        ...restProps
    }: Props = $props();

    function getPaintStyle() {
        let style = {
            paint: false,
            style: `color: ${backgroundColor};`,
        };

        if ($cosmetics) {
            const userPaint = getPaint(platform, platformID);

            style["paint"] =
                typeof userPaint != "undefined" &&
                chatSettings["paints"] == true;

            if (userPaint && chatSettings["paints"]) {
                const paintHTML = getPaintHTML(userPaint);

                style["style"] += paintHTML.paint;

                if (chatSettings["paintShadows"])
                    style["style"] += paintHTML.shadow;

                if (
                    !chatSettings["paintShadows"] &&
                    chatSettings["fontStroke"]
                ) {
                    style["style"] += "-webkit-text-stroke: 1px black;";
                }
            }
        }

        return style;
    }

    let paintStyle = $derived(getPaintStyle());
</script>

<strong
    class="username"
    class:paint={paintStyle["paint"]}
    style={paintStyle["style"]}
    {...restProps}
>
    {@render children()}
</strong>

<style lang="scss">
    .paint {
        -webkit-text-fill-color: transparent;
        background-clip: text;
        -webkit-background-clip: text;
        background-size: 100% 100%;
        text-shadow: none;
    }

    strong {
        font-weight: inherit;
    }
</style>
