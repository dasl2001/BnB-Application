import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { supaAdmin } from "@/lib/supabase";
import { registerInput, loginInput } from "@/lib/schemas";
import { clean } from "../utils";
import type { Vars } from "../types";

const isDev = process.env.NODE_ENV !== "production";

/*
Här hanteras användarregistrering, inloggning, utloggning och
hämtning av inloggad användare via Supabase Auth.
*/
export const auth = new Hono<{ Variables: Vars }>();

/*
Använder Supabase Auth för att skapa ett konto (signUp).
Efter lyckad registrering skapas även en rad i users-tabellen i databasen.
Den raden används för att knyta ihop auth_user_id (Supabase UID) med appens egen användarprofil.
*/
auth.post("/register", zValidator("json", registerInput), async (c) => {
  const anon = c.get("supa");
  const { email, password, name } = c.req.valid("json");

/*
Registrera användaren i Supabase Auth
*/
  const { data, error } = await anon.auth.signUp({
    email: clean(email).toLowerCase(),
    password: clean(password),
  });
  if (error) return c.json({ error: error.message }, 400);

/*
Skapa motsvarande post i vår egen "users"-tabell
Här kopplas Supabase-användar-ID till vår interna user-rad)
Service-role klient utan RLS-begränsningar
Lagrar ej riktiga lösenord
Länka Supabase UID till user-tabellen
*/
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

/*
Kör auth.signInWithPassword för att verifiera användarens uppgifter.
Hämtar access_token och refresh_token.
Dessa lagras i httpOnly-cookies:
sb-access-token (kortlivad)
sb-refresh-token (förlängd session)
Dessa cookies används av middleware.ts för att autentisera varje request.
*/
auth.post("/login", zValidator("json", loginInput), async (c) => {
  const client = c.get("supa");
  const { email, password } = c.req.valid("json");

/*
Logga in användaren via Supabase Auth
*/
  const { data, error } = await client.auth.signInWithPassword({
    email: clean(email).toLowerCase(),
    password,
  });
  if (error) return c.json({ error: error.message }, 400);
  const access = data.session?.access_token;
  const refresh = data.session?.refresh_token;

/*
Sätt säkra cookies för sessionen
*/
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

/*
Returnerar användaren som identifierats i middleware.
Om ingen token finns → { user: null }.
*/
auth.get("/me", (c) => c.json({ user: c.get("authUser") ?? null }));

/*
Raderar cookies så att sessionen blir ogiltig.
Supabase återkallar automatiskt access-token i bakgrunden.
*/
auth.post("/logout", (c) => {
  deleteCookie(c, "sb-access-token", { path: "/" });
  deleteCookie(c, "sb-refresh-token", { path: "/" });
  return c.json({ ok: true });
});
