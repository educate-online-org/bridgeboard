import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Fake auth for the demo. Not secure, by design.
export const USERNAME = "sits_admin";
export const PASSWORD = "demo123";
export const COOKIE = "sits_session";

export async function requireSession() {
  const store = await cookies();
  if (store.get(COOKIE)?.value !== "ok") redirect("/login");
}
