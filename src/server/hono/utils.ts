import type { Context } from "hono";
import type { Vars } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js"; 
export const isDev = process.env.NODE_ENV !== "production";
export const clean = (v: string) =>
  String(v ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\u00A0]/g, "")
    .trim();
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export function weekStart(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const diffToMon = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diffToMon);
  return isoDate(d);
}
export function weekEnd(dateStr: string) {
  const start = new Date(weekStart(dateStr) + "T00:00:00");
  start.setDate(start.getDate() + 6);
  return isoDate(start);
}
export function requireAuth(c: Context<{ Variables: Vars }>) {
  const u = c.get("authUser");
  if (!u) return c.json({ error: "Unauthorized" }, 401);
  return null;
}
export async function currentUserId(
  db: SupabaseClient,
  authUserId: string
): Promise<string> {
  const { data, error } = await db
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !data) {
    throw new Error("User mapping missing");
  }
  return data.id as string;
}

