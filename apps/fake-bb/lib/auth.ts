import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Fake auth for the demo. Not secure, by design.
export const USERNAME = "bb_admin";
export const PASSWORD = "demo123";
export const COOKIE = "bb_session";

export async function requireSession() {
  const store = await cookies();
  if (store.get(COOKIE)?.value !== "ok") redirect("/login");
}
