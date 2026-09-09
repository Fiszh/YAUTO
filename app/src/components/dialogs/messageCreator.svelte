<script lang="ts">
    import Dialog from "$components/Dialog.svelte";
    import Button from "$components/Inputs/Button.svelte";
    import Input from "$components/Inputs/Input.svelte";
    import { t } from "svelte-i18n";

    type Props = {
        show: boolean;
        username: string;
        message: string;
        channel: string;
        loadUserInfo: () => void;
    };

    let {
        show = $bindable(false),
        username = $bindable("uniiDev"),
        message = $bindable("Hello from UChat!"),
        channel = $bindable("Twitch"),
        loadUserInfo,
    }: Props = $props();

    function save() {
        loadUserInfo();
        show = false;
    }
</script>

<Dialog bind:show name={$t("mobile_footer.settings")}>
    <div id="layout">
        <section id="inputs">
            <label>
                <p>{$t("labels.username")}:</p>
                <Input
                    wide
                    type="text"
                    placeholder="Username"
                    bind:value={username}
                />
            </label>
            <label>
                <p>{$t("labels.message")}:</p>
                <Input
                    wide
                    type="text"
                    placeholder="Message"
                    bind:value={message}
                />
            </label>
            <label>
                <p>{$t("labels.channel")}:</p>
                <Input
                    wide
                    type="text"
                    placeholder="Channel"
                    bind:value={channel}
                />
            </label>
        </section>

        <Button primary center onclick={save}>Save</Button>
    </div>
</Dialog>

<style lang="scss">
    #layout {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
</style>
