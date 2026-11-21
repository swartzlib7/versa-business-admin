#!/usr/bin/env node
/**
 * Back up a Versa - Business Admin install (1.0.14).
 *
 *   npm run backup                      database + settings + uploads
 *   npm run backup -- --no-uploads      skip the uploads folder
 *   npm run backup -- --out /mnt/backup write somewhere else (default ./backups)
 *
 * Writes one folder per run, e.g. backups/vba-2026-11-19-1530/:
 *   db.dump            pg_dump custom format (restore: pg_restore -d "$DATABASE_URL" --clean db.dump)
 *   env.local          a copy of .env.local (holds secrets: keep the backup private)
 *   data/              .data/site-settings.json, catalog.json, sample-data.json when present
 *   uploads.tar.gz     record-images/ and record-files/ from the uploads folder
 *   manifest.json      what was included, sizes, version
 *
 * Uploads: the folder is VBA_UPLOADS_DIR (default .data). When it is a drive
 * that is already backed up (a synced Google Drive / OneDrive folder), skip it
 * with --no-uploads or set VBA_BACKUP_UPLOADS=false in .env.local.
 * Needs pg_dump on the PATH for the database part (DATA_SOURCE=postgres).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: npm run backup -- [--out DIR] [--no-uploads | --uploads]");
  process.exit(0);
}
const outIndex = args.indexOf("--out");
const outRoot = resolve(outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1] : "backups");
const envWantsUploads = (process.env.VBA_BACKUP_UPLOADS ?? "true").trim().toLowerCase() !== "false";
const includeUploads = args.includes("--uploads") ? true : args.includes("--no-uploads") ? false : envWantsUploads;

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const dir = join(outRoot, `vba-${stamp}`);
mkdirSync(dir, { recursive: true });

const version = (() => {
  try {
    return JSON.parse(readFileSync("package.json", "utf8")).version;
  } catch {
    return "unknown";
  }
})();
const manifest = { product: "Versa - Business Admin", version, created_at: now.toISOString(), items: [], skipped: [] };
const size = (file) => (existsSync(file) ? statSync(file).size : 0);
let failed = false;

// 1. Database
const usesPostgres = (process.env.DATA_SOURCE ?? "postgres").trim() !== "fixture";
if (usesPostgres && process.env.DATABASE_URL) {
  const file = join(dir, "db.dump");
  const run = spawnSync("pg_dump", [process.env.DATABASE_URL, "-Fc", "-f", file], { stdio: ["ignore", "inherit", "inherit"] });
  if (run.status === 0) {
    manifest.items.push({ item: "database", file: "db.dump", bytes: size(file) });
  } else {
    failed = true;
    manifest.skipped.push({ item: "database", reason: run.error ? String(run.error.message) : `pg_dump exited ${run.status}` });
  }
} else {
  manifest.skipped.push({ item: "database", reason: usesPostgres ? "DATABASE_URL is not set" : "DATA_SOURCE=fixture (no database)" });
}

// 2. Settings files
if (existsSync(".env.local")) {
  copyFileSync(".env.local", join(dir, "env.local"));
  manifest.items.push({ item: "env", file: "env.local", bytes: size(".env.local") });
}
mkdirSync(join(dir, "data"), { recursive: true });
for (const name of ["site-settings.json", "catalog.json", "sample-data.json"]) {
  const from = join(".data", name);
  if (!existsSync(from)) continue;
  copyFileSync(from, join(dir, "data", name));
  manifest.items.push({ item: "data", file: `data/${name}`, bytes: size(from) });
}

// 3. Uploads (optional)
const uploadsRoot = process.env.VBA_UPLOADS_DIR?.trim() ? resolve(process.env.VBA_UPLOADS_DIR.trim()) : resolve(".data");
const uploadDirs = ["record-images", "record-files"].filter((name) => existsSync(join(uploadsRoot, name)));
if (!includeUploads) {
  manifest.skipped.push({ item: "uploads", reason: "turned off (--no-uploads or VBA_BACKUP_UPLOADS=false)", folder: uploadsRoot });
} else if (!uploadDirs.length) {
  manifest.skipped.push({ item: "uploads", reason: "no uploads yet", folder: uploadsRoot });
} else {
  const file = join(dir, "uploads.tar.gz");
  const run = spawnSync("tar", ["-czf", file, "-C", uploadsRoot, ...uploadDirs], { stdio: ["ignore", "inherit", "inherit"] });
  if (run.status === 0) {
    manifest.items.push({ item: "uploads", file: "uploads.tar.gz", bytes: size(file), folder: uploadsRoot, includes: uploadDirs });
  } else {
    failed = true;
    manifest.skipped.push({ item: "uploads", reason: `tar exited ${run.status}`, folder: uploadsRoot });
  }
}

writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const mb = (n) => `${(n / (1024 * 1024)).toFixed(1)} MB`;
console.log(`Backup written to ${dir}`);
for (const item of manifest.items) console.log(`  ✓ ${item.file} (${mb(item.bytes)})`);
for (const item of manifest.skipped) console.log(`  – ${item.item}: ${item.reason}`);
if (failed) {
  console.error("Backup finished with errors (see above).");
  process.exit(1);
}
