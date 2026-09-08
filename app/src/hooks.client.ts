import { dev } from "$app/env";
import * as Sentry from "@sentry/svelte";

const params = new URLSearchParams(location.search);
const trackingDisabled = params.get("track") == "0";
const DSN = import.meta.env.PUBLIC_SENTRY_DSN;

if (!trackingDisabled && !dev && DSN) {
    Sentry.init({
        dsn: DSN,

        environment: __DEBUG__ ? "development" : "production",
        release: __APP_VERSION,

        integrations: [Sentry.browserTracingIntegration()],

        tracesSampleRate: 0.2,
        tracePropagationTargets: ["localhost", /^https:\/\/api\.unii\.dev/],
    });
}
