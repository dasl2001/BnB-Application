import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { supaAdmin } from "@/lib/supabase";
import { registerInput, loginInput } from "@/lib/schemas";
import { clean } from "../utils";
import type { Vars } from "../types";
const isDev = process.env.NODE_ENV !== "production";
export const auth = new Hono<{ Variables: Vars }>();
auth.post("/register", zValidator("json", registerInput), async (c) => {
  const anon = c.get("supa");
  const { email, password, name } = c.req.valid("json");
  const { data, error } = await anon.auth.signUp({
    email: clean(email).toLowerCase(),
    password: clean(password),
  });
  if (error) return c.json({ error: error.message }, 400);
  const admin = supaAdmin();
  const { error: insErr } = await admin.from("users").insert({
    name: clean(name),
    email: clean(email).toLowerCase(),
    password: "handled-by-auth",
    is_admin: false,
    auth_user_id: data.user!.id,
  });
  if (insErr) return c.json({ error: insErr.message }, 400);
  return c.json({ ok: true }, 201);
});
auth.post("/login", zValidator("json", loginInput), async (c) => {
  const client = c.get("supa");
  const { email, password } = c.req.valid("json");
  const { data, error } = await client.auth.signInWithPassword({
    email: clean(email).toLowerCase(),
    password,
  });
  if (error) return c.json({ error: error.message }, 400);
  const access = data.session?.access_token;
  const refresh = data.session?.refresh_token;
  if (access)
    setCookie(c, "sb-access-token", access, {
      httpOnly: true,
      secure: !isDev,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 2,
    });
  if (refresh)
    setCookie(c, "sb-refresh-token", refresh, {
      httpOnly: true,
      secure: !isDev,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  return c.json({ ok: true });
});
auth.get("/me", (c) => c.json({ user: c.get("authUser") ?? null }));
auth.post("/logout", (c) => {
  deleteCookie(c, "sb-access-token", { path: "/" });
  deleteCookie(c, "sb-refresh-token", { path: "/" });
  return c.json({ ok: true });
});
