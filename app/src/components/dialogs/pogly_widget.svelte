<script lang="ts">
    import Dialog from "$components/Dialog.svelte";
    import Button from "$components/Inputs/Button.svelte";
    import Pogly from "$components/logos/pogly.svelte";
    import { generatePoglyWidget } from "$lib/pogly";
    import { isMobile } from "$stores/global";
    import { Store } from "@lucide/svelte";
    import { t } from "svelte-i18n";

    type Props = {
        show: boolean;
    };

    let { show = $bindable(false) }: Props = $props();

    function copyAsPoglyWidget() {
        navigator.clipboard
            .writeText(JSON.stringify(generatePoglyWidget()))
            .then(() => {
                alert($t("toasts.pogly_widget_copied"));
            })
            .catch((err) => {
                console.error("Failed to copy URL: ", err);
            });
    }
</script>

{#snippet marketIcon()}
    <Store size={$isMobile ? "1rem" : "1.5rem"} />
{/snippet}

<Dialog name="Pogly Widget" bind:show>
    <div id="layout">
        <h2><Pogly size="1.5rem" brandColor />UChat as Pogly widget</h2>
        <div id="buttons">
            <Button
                href="https://widget.pogly.gg/4098"
                target="_blank"
                rel="noopener noreferrer"
                icon={marketIcon}
                primary
            >
                Marketplace Widget
            </Button>
            <small>
                <button onclick={copyAsPoglyWidget}>Copy as import</button>
            </small>
        </div>
    </div>
</Dialog>

<style lang="scss">
    #layout {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        h2 {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        #buttons {
            display: flex;
            flex-direction: column;
        }

        small {
            button {
                all: unset;
                cursor: pointer;
                opacity: 0.25;

                transition: opacity 0.25s ease;

                &:hover {
                    opacity: 0.5;
                }
            }

            color: white;
            text-align: center;
        }
    }
</style>
