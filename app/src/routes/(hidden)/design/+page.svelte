<script lang="ts">
    import Button from "$components/Inputs/Button.svelte";
    import Toggle from "$components/Inputs/Toggle.svelte";
    import Checkbox from "$components/Inputs/Checkbox.svelte";
    import Input from "$components/Inputs/Input.svelte";
    import Color from "$components/Inputs/Color.svelte";
    import SegmentedControl from "$components/Inputs/Segmented-control.svelte";
    import Selector from "$components/Inputs/Selector.svelte";
    import Dropdown from "$components/Inputs/Dropdown.svelte";
    import { House, ChevronRight, Search, Brush } from "@lucide/svelte";
    import Twitch from "$components/logos/twitch.svelte";
    import Kick from "$components/logos/kick.svelte";
    import Youtube from "$components/logos/youtube.svelte";
    import Dialog from "$components/Dialog.svelte";
    import UChat from "$components/logos/uchat.svelte";
    import Loading from "$components/Loading.svelte";
    import Slider from "$components/Inputs/Slider.svelte";
    import Chatterino from "$components/logos/chatterino.svelte";
    import Turteg from "$components/logos/turteg.svelte";
    import Ffz from "$components/logos/ffz.svelte";
    import Bttv from "$components/logos/bttv.svelte";
    import ChatterinoHomies from "$components/logos/chatterino-homies.svelte";
    import Stv from "$components/logos/7tv.svelte";
    import Polandbot from "$components/logos/polandbot.svelte";
    import { addToast } from "$lib/toast";
    import { t } from "svelte-i18n";
    import CalloutBubble from "$components/CalloutBubble.svelte";
    import Pogly from "$components/logos/pogly.svelte";

    let selectorOptions = $state([
        { enabled: true, label: "Lorem" },
        { enabled: true, label: "ipsum" },
        { enabled: true, label: "dolor" },
        { enabled: true, label: "sit" },
    ]);

    let showTestDialog = $state(false);
    let areLoadingRelative = $state(true);
    let disableToastTimeout = $state(true);

    function displayTestToast() {
        addToast({
            msg: "Test message toast",
            timeout: disableToastTimeout ? 0 : undefined,
        });
        addToast({
            msg: "Test success toast",
            type: "success",
            timeout: disableToastTimeout ? 0 : undefined,
        });
        addToast({
            msg: "Test error toast",
            type: "error",
            timeout: disableToastTimeout ? 0 : undefined,
        });
    }
</script>

{#snippet buttons()}
    <Button danger>Lorem</Button>
    <section>
        <Button>Ipsum</Button>
        <Button secondary>Dolor</Button>
    </section>
{/snippet}

<Dialog bind:show={showTestDialog} name="Lorem" {buttons}>
    <section id="layout">
        <h2>Lorem ipsum</h2>
        <small>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore
        </small>
    </section>
</Dialog>

<main>
    <section>
        <h1><Brush /> UChat Design</h1>
        <p>Test and preview design components here.</p>
    </section>

    <p>{$t("hello", { values: { name: "i18n" } })}</p>

    {#snippet icon()}
        <House size="1rem" />
    {/snippet}
    {#snippet iconRight()}
        <ChevronRight size="1rem" />
    {/snippet}
    {#snippet iconSearch()}
        <Search size="1rem" />
    {/snippet}

    {#snippet logoTwitch(chosen: boolean)}
        <Twitch brandColor={chosen} />
    {/snippet}
    {#snippet logoKick(chosen: boolean)}
        <Kick brandColor={chosen} />
    {/snippet}
    {#snippet logoYouTube(chosen: boolean)}
        <Youtube brandColor={chosen} />
    {/snippet}
    {#snippet logoUChat(chosen: boolean)}
        <UChat brandColor={chosen} />
    {/snippet}
    {#snippet logoPolandbot(chosen: boolean)}
        <Polandbot brandColor={chosen} />
    {/snippet}

    {#snippet brandLogos(brandColor: boolean)}
        <UChat {brandColor} />
        <Twitch {brandColor} />
        <Kick {brandColor} />
        <Chatterino {brandColor} />
        <ChatterinoHomies {brandColor} />
        <Turteg {brandColor} />
        <Polandbot {brandColor} />
        <Stv {brandColor} />
        <Bttv {brandColor} />
        <Ffz {brandColor} />
        <Pogly {brandColor} />
    {/snippet}

    {#snippet dropdown()}
        <Button>Lorem</Button>
        <Button>ipsum</Button>
        <Button>dolor</Button>
    {/snippet}

    <section>
        <p>Buttons Primary</p>
        <Button primary {icon}>Lorem ipsum</Button>
        <Button primary {iconRight}>Lorem ipsum</Button>
        <Button primary>Lorem ipsum</Button>
        <Button primary disabled>Lorem ipsum</Button>
    </section>

    <section>
        <p>Buttons Secondary</p>
        <Button secondary {icon}>Lorem ipsum</Button>
        <Button secondary {iconRight}>Lorem ipsum</Button>
        <Button secondary>Lorem ipsum</Button>
        <Button secondary disabled>Lorem ipsum</Button>
    </section>

    <section>
        <p>Buttons Ghost</p>
        <Button {icon}>Lorem ipsum</Button>
        <Button {iconRight}>Lorem ipsum</Button>
        <Button>Lorem ipsum</Button>
        <Button disabled>Lorem ipsum</Button>
    </section>

    <section>
        <p>Buttons Danger</p>
        <Button danger {icon}>Lorem ipsum</Button>
        <Button danger {iconRight}>Lorem ipsum</Button>
        <Button danger>Lorem ipsum</Button>
        <Button danger disabled>Lorem ipsum</Button>
    </section>

    <section>
        <p>Buttons Approve</p>
        <Button approve {icon}>Lorem ipsum</Button>
        <Button approve {iconRight}>Lorem ipsum</Button>
        <Button approve>Lorem ipsum</Button>
        <Button approve disabled>Lorem ipsum</Button>
    </section>

    <section>
        <p>Dropdown</p>
        <Dropdown {dropdown}>Lorem</Dropdown>
    </section>

    <section>
        <p>Dropdown Reversed</p>
        <Dropdown {dropdown} reversed>Lorem</Dropdown>
    </section>

    <section>
        <p>Toggles</p>
        <Toggle checked={true} />
        <Toggle />
        <Toggle disabled />
    </section>

    <section>
        <p>Checkboxes</p>
        <Checkbox checked={true}>Checked</Checkbox>
        <Checkbox>Unchecked</Checkbox>
    </section>

    <section>
        <p>Inputs</p>
        <Input icon={iconSearch} {iconRight} placeholder="Search..." />
        <Input disabled />
        <Input />
        <Input placeholder="Invalid Input" invalid />
    </section>

    <section>
        <p>Color</p>
        <Color />
    </section>

    <section>
        <p>Segment Control</p>
        <SegmentedControl
            options={[
                { id: "1", label: "Twitch", icon: logoTwitch },
                { id: "2", label: "Kick", icon: logoKick },
                { id: "3", label: "UChat", icon: logoUChat },
                { id: "4", label: "PolandBot", icon: logoPolandbot },
                {
                    id: "15",
                    label: "YouTube",
                    disabled: true,
                    icon: logoYouTube,
                },
            ]}
        />
    </section>

    <section>
        <p>Selector</p>
        <Selector options={selectorOptions} />
    </section>

    <section>
        <p>Dialog</p>
        <Button onclick={() => (showTestDialog = true)}>Show Dialog</Button>
    </section>

    <section>
        <p>Slider</p>
        <Slider max="100" value={"25"} />
        <Slider max="100" displayValue value={"25"} />
    </section>

    <section>
        <p>Logos - No Color</p>
        {@render brandLogos(false)}
    </section>

    <section>
        <p>Logos - Color</p>
        {@render brandLogos(true)}
    </section>

    <section>
        <p>
            Loading
            <Checkbox bind:checked={areLoadingRelative}>Relative</Checkbox>
        </p>
        <Loading type="big" relative={areLoadingRelative} />
        <Loading type="minimal" relative={areLoadingRelative} />
        <Loading type="small" relative={areLoadingRelative} />
    </section>

    <section>
        <p>
            Toast
            <Checkbox bind:checked={disableToastTimeout}>
                No Hide Timeout
            </Checkbox>
        </p>
        <Button secondary onclick={displayTestToast}>Display Toasts</Button>
    </section>

    <section>
        <p>Callout Bubble</p>
        <CalloutBubble relative>Lorem Ipsum!</CalloutBubble>
        <CalloutBubble type="error" relative>Input Required</CalloutBubble>
    </section>
</main>

<style>
    p,
    h1 {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    main > *:nth-child(1) {
        width: 100%;
    }

    main {
        padding: 0.5rem 1rem;

        width: 100%;

        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 1rem;

        overflow-y: auto;

        section {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
    }
</style>
