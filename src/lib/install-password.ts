/** Seeded install password. A login that still uses it must set a new one. */
export const INSTALL_DEFAULT_PASSWORD = "mission2026";

export function isInstallDefaultPassword(password: string): boolean {
  return password === INSTALL_DEFAULT_PASSWORD;
}
