import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { execSync } from "node:child_process";
import pkg from "./package.json" with { type: "json" };

const commitHash = execSync("git rev-parse HEAD").toString().trim();
const repoUrl = execSync("git remote get-url origin")
    .toString()
    .trim()
    .replace(/\.git$/, "");

const isDebug = process.argv.includes("--debug");

export default defineConfig({
    plugins: [sveltekit()],
    preview: {
        allowedHosts: [".unii.dev", "unii.dev", "localhost"],
    },
    server: {
        allowedHosts: [".unii.dev", "unii.dev"],
    },
    define: {
        __COMMIT_HASH: JSON.stringify(commitHash),
        __BUILD_DATE: JSON.stringify(new Date().toISOString()),
        __REPO_URL: JSON.stringify(repoUrl),
        __APP_VERSION: JSON.stringify(pkg.version),
        __DEBUG__: JSON.stringify(isDebug),
        "import.meta.env.API_URL": JSON.stringify(
            process.env.API_URL ?? "https://api.unii.dev",
        ),
        "import.meta.env.WS_URL": JSON.stringify(
            process.env.WS_URL ?? "wss://api.unii.dev",
        ),
    },
});
