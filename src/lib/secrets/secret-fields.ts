/**
 * Secret fields in records (1.0.18 security fix, state_integrations.md §3.4).
 *
 * Stored: encrypted (secret-box.ts). Read through the API: masked, for every
 * user. A JSON value (a credential's Configuration) keeps its shape, and only
 * the values under secret-looking keys (password, token, api_key, …) become
 * MASK, so an admin can still see and change the host or port. Any other value
 * is masked whole. Saving MASK back keeps the stored value, so a form saved
 * without touching the secret keeps it.
 *
 * Server code that needs the real value calls `readRecordSecret` (read-secret.ts).
 */
import { listAllFieldDefinitions, listFieldDefinitions } from "@/lib/fixtures/catalog";
import { decryptSecret, encryptSecret, isEncrypted } from "@/lib/secrets/secret-box";

export const MASK = "••••••";

const SECRET_KEY = /(pass(word|wd|phrase)?|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|bearer)/i;
const NOT_SECRET_SUFFIX = /(_hint|_id|_at|_type|_url)$/i;

/** Always secret, also before the catalog is loaded. */
const KNOWN_SECRET_FIELDS: Record<string, string[]> = {
  vendor_credential: ["configuration"],
};

/** API names of the secret fields of a record type. */
export function secretFieldsFor(typeApiName: string): string[] {
  const out = new Set(KNOWN_SECRET_FIELDS[typeApiName] ?? []);
  try {
    for (const field of listFieldDefinitions(typeApiName)) {
      if (field.is_secret === true) out.add(field.api_name);
    }
  } catch {
    /* catalog not available (scripts, tests): the known list stands */
  }
  return [...out];
}

/** Record types that have at least one secret field. */
export function secretTypes(): string[] {
  const out = new Set(Object.keys(KNOWN_SECRET_FIELDS));
  try {
    for (const field of listAllFieldDefinitions()) if (field.is_secret === true) out.add(field.object_api_name);
  } catch {
    /* catalog not available: the known list stands */
  }
  return [...out];
}

export function isSecretKey(key: string): boolean {
  return SECRET_KEY.test(key) && !NOT_SECRET_SUFFIX.test(key);
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function parseStructured(value: string): Json | undefined {
  const text = value.trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return undefined;
  try {
    return JSON.parse(text) as Json;
  } catch {
    return undefined;
  }
}

function maskTree(node: Json, underSecret: boolean): Json {
  if (Array.isArray(node)) return node.map((item) => maskTree(item, underSecret));
  if (node && typeof node === "object") {
    const out: { [key: string]: Json } = {};
    for (const [key, child] of Object.entries(node)) out[key] = maskTree(child, underSecret || isSecretKey(key));
    return out;
  }
  if (underSecret && node !== null && node !== "" && typeof node !== "boolean") return MASK;
  return node;
}

/** What the API shows for a plain secret value. */
export function maskSecretValue(plain: string): string {
  if (!plain) return "";
  const tree = parseStructured(plain);
  if (tree === undefined || tree === null || typeof tree !== "object") return MASK;
  return JSON.stringify(maskTree(tree, false), null, 2);
}

function restoreTree(incoming: Json, stored: Json | undefined): Json {
  if (incoming === MASK) return stored === undefined ? "" : stored;
  if (Array.isArray(incoming)) {
    return incoming.map((item, i) => restoreTree(item, Array.isArray(stored) ? stored[i] : undefined));
  }
  if (incoming && typeof incoming === "object") {
    const base = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : undefined;
    const out: { [key: string]: Json } = {};
    for (const [key, child] of Object.entries(incoming)) out[key] = restoreTree(child, base?.[key]);
    return out;
  }
  return incoming;
}

function treeHasMask(node: Json): boolean {
  if (node === MASK) return true;
  if (Array.isArray(node)) return node.some(treeHasMask);
  if (node && typeof node === "object") return Object.values(node).some(treeHasMask);
  return false;
}

/**
 * True when a value still carries MASK anywhere. Checked on the parsed JSON as
 * well as the text: a client may send the mask escaped (Python's json.dumps
 * writes it as \u2022), which a text search would miss and store as the secret.
 */
export function carriesMask(value: string): boolean {
  if (value.includes(MASK)) return true;
  if (!/\\u2022/i.test(value)) return false;
  const tree = parseStructured(value);
  return tree !== undefined && treeHasMask(tree);
}

/**
 * Put stored values back where the incoming value still carries MASK.
 * `storedPlain` is the current plain value (null when there is none or it cannot be read).
 */
export function restoreMasked(incoming: string, storedPlain: string | null): string {
  if (!carriesMask(incoming)) return incoming;
  if (incoming.trim() === MASK) return storedPlain ?? "";
  const tree = parseStructured(incoming);
  if (tree === undefined) return incoming;
  const stored = storedPlain ? parseStructured(storedPlain) : undefined;
  return JSON.stringify(restoreTree(tree, stored));
}

/**
 * Seal the secret fields of a header before it is written. `current` is the
 * stored header (null on create). Returns the header to store.
 */
export function sealSecretFields(
  typeApiName: string,
  header: Record<string, string>,
  current: Record<string, string> | null,
): Record<string, string> {
  const fields = secretFieldsFor(typeApiName);
  if (!fields.length) return header;
  const out = { ...header };
  for (const field of fields) {
    const value = out[field];
    if (value === undefined || value === "" || isEncrypted(value)) continue;
    const storedRaw = current?.[field] ?? "";
    if (carriesMask(value)) {
      // Unchanged secret: keep the stored value exactly, even when it cannot be read.
      if (value.trim() === MASK && storedRaw) {
        out[field] = storedRaw;
        continue;
      }
      const storedPlain = storedRaw ? decryptSecret(storedRaw) : null;
      if (storedRaw && storedPlain === null) {
        console.warn(`Secret field ${typeApiName}.${field} could not be decrypted; the stored value is kept.`);
        out[field] = storedRaw;
        continue;
      }
      const restored = restoreMasked(value, storedPlain);
      out[field] = restored ? encryptSecret(restored) : "";
      continue;
    }
    out[field] = encryptSecret(value);
  }
  return out;
}

/** Mask the secret fields of a stored header for reading. */
export function maskSecretFields(typeApiName: string, header: Record<string, string>): Record<string, string> {
  const fields = secretFieldsFor(typeApiName);
  if (!fields.length) return header;
  const out = { ...header };
  for (const field of fields) {
    const raw = out[field];
    if (!raw) continue;
    const plain = decryptSecret(raw);
    out[field] = plain === null ? MASK : maskSecretValue(plain);
  }
  return out;
}
