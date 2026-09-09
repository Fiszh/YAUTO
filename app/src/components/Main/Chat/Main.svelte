<script lang="ts">
    import { onMount } from "svelte";
    import { MessageSquare, Settings } from "@lucide/svelte";

    import SettingsDisplay from "./Settings.svelte";
    import Display from "./Display.svelte";

    import ChatDisplay from "$components/ChatDisplay.svelte";

    import { getBadges } from "$lib/preview";
    import SevenTV_main from "$lib/services/7TV/main";
    import { pushUsersInfoViaGQL } from "$lib/services/7TV/cosmetics";
    import { messages } from "$lib/chat";

    import { emotes, badges, isMobile } from "$stores/global";
    import { cosmetics } from "$stores/cosmetics";
    import { previewMessages } from "$stores/previewMessages";
    import { t } from "svelte-i18n";
    import QuickPreview from "$components/QuickPreview.svelte";

    let tab: string = $state("settings");

    onMount(async () => {
        if (!$badges["TTV"].global.length) await getBadges();

        if (!$emotes["7TV"]["global"].length) {
            const previewEmotes = await SevenTV_main.emoteSet.bySetID(
                "01JGAC1F503T2852YKXC8G9VN1",
            );

            emotes.update((e) => {
                e["7TV"]["global"] = previewEmotes;

                return e;
            });
        }

        if (!$cosmetics.badges.length && !$cosmetics.paints.length) {
            const stv_users = [
                "01GAK4CXN00002Z53DR6PAWQVE",
                "01FDSMJ8MG0005Y8ZGBVC26NJ6",
                "01FH0MNYA800096T3FQZKZQVZB",
                "01F74DWQMR0005C7FW3P0F45Y5",
                "01JFK40WSQZ9H3SMKNGXPPDXP2",
            ];

            await pushUsersInfoViaGQL(stv_users);
        }
    });

    const changeTab = (setTab: string) => (tab = setTab);

    $effect(() => {
        if (tab != "settings" || !$isMobile) {
            messages.set(previewMessages);
        }
    });
</script>

<section>
    {#if $isMobile}
        {#if tab == "settings"}
            <QuickPreview />
            <SettingsDisplay />
        {:else}
            <Display />
        {/if}

        <footer>
            <button onclick={() => changeTab("settings")}>
                <Settings size="15" />
                {$t("mobile_footer.settings")}
            </button>
            <button onclick={() => changeTab("preview")}>
                <MessageSquare size="15" />
                {$t("mobile_footer.preview")}
            </button>
        </footer>
    {:else}
        <SettingsDisplay />
        <Display />
    {/if}
</section>

<style lang="scss">
    section {
        display: flex;
        height: 100%;
        width: 100%;
    }

    @media (max-width: 768px) {
        section {
            flex-direction: column;
            overflow: hidden;
        }

        footer {
            border-top: 1px #161616 solid;
            padding: 0.5rem 2rem;
            box-sizing: border-box;
            width: 100%;
            display: flex;
            justify-content: space-evenly;

            font-size: 0.6rem;

            button {
                all: unset;
                pointer-events: auto;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
        }
    }
</style>
