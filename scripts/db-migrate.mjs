#!/usr/bin/env node
import { spawn } from "node:child_process";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env.local or run: sudo bash scripts/provision-local-postgres.sh",
  );
  process.exit(1);
}

const child = spawn("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
