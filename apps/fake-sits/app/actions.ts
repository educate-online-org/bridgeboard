"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LAYOUTS, type Layout } from "@bridgeboard/shared";
import { COOKIE, PASSWORD, USERNAME } from "@/lib/auth";
import { setLayout } from "@/lib/db";

export async function login(formData: FormData) {
  if (formData.get("username") !== USERNAME || formData.get("password") !== PASSWORD) {
    redirect("/login?error=1");
  }
  (await cookies()).set(COOKIE, "ok", { httpOnly: true, path: "/" });
  redirect("/modules");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

export async function switchLayout(formData: FormData) {
  const layout = formData.get("layout") as Layout;
  if (LAYOUTS.includes(layout)) setLayout(layout);
  revalidatePath("/", "layout");
}
