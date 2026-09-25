import { cookies } from "next/headers";
import { AUTH_CONFIG, getSessionFromToken } from "@/lib/auth";

export async function signedInVisitor(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(AUTH_CONFIG.cookieName)?.value;
  return getSessionFromToken(token) != null;
}
