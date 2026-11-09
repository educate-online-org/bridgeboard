"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LAYOUTS, type BbItem, type Layout, type Visibility } from "@bridgeboard/shared";
import { COOKIE, PASSWORD, USERNAME, requireSession } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function login(formData: FormData) {
  if (formData.get("username") !== USERNAME || formData.get("password") !== PASSWORD) {
    redirect("/login?error=1");
  }
  (await cookies()).set(COOKIE, "ok", { httpOnly: true, path: "/" });
  redirect("/courses");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

export async function switchLayout(formData: FormData) {
  const layout = formData.get("layout") as Layout;
  if (!LAYOUTS.includes(layout)) return;
  const db = readDb();
  db.layout = layout;
  writeDb(db);
  revalidatePath("/", "layout");
}

export interface NewItem {
  courseCode: string;
  parentFolder: string | null;
  type: BbItem["type"];
  title: string;
  bodyHtml: string;
  visibility: Visibility;
}

export async function createItem(input: NewItem): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const db = readDb();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required." };
  if (!db.courses.some((c) => c.courseCode === input.courseCode)) return { ok: false, error: "Unknown course." };
  if (input.parentFolder && !db.items.some((i) => i.id === input.parentFolder && i.type === "folder")) {
    return { ok: false, error: "Folder not found." };
  }
  db.items.push({
    id: randomUUID(),
    courseCode: input.courseCode,
    parentFolder: input.parentFolder,
    type: input.type,
    title,
    bodyHtml: input.type === "document" ? input.bodyHtml : "",
    visibility: input.visibility === "visible" ? "visible" : "hidden",
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  revalidatePath(`/courses/${input.courseCode}`);
  revalidatePath("/admin/review");
  return { ok: true };
}

/** Visibility can be changed on an existing item, the way Ultra's per-row pill works. */
export async function setVisibility(input: {
  id: string;
  visibility: Visibility;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const db = readDb();
  const item = db.items.find((i) => i.id === input.id);
  if (!item) return { ok: false, error: "Item not found." };
  item.visibility = input.visibility === "visible" ? "visible" : "hidden";
  writeDb(db);
  revalidatePath(`/courses/${item.courseCode}`);
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function publishItem(formData: FormData) {
  await requireSession();
  const db = readDb();
  const item = db.items.find((i) => i.id === formData.get("id"));
  if (item) {
    item.visibility = "visible";
    writeDb(db);
  }
  revalidatePath("/", "layout");
}
