import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";

export const auth = betterAuth({
    database: new Database(process.env.DATABASE_URL || "movecoder.sqlite"),
    emailAndPassword: {
        enabled: true,
    },
    appName: "movecoder-cli",
    plugins: [
        openAPI(), // Optional: for API docs if we want
    ],
});