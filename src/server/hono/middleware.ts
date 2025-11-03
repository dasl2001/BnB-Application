import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import { supa } from "@/lib/supabase";
import type { Vars } from "./types";

export const supabaseMiddleware: MiddlewareHandler<{ Variables: Vars }> = async (c, next) => {
  // Hämta access token från cookie (från Supabase-auth)
  const accessToken = getCookie(c, "sb-access-token");
  const refreshToken = getCookie(c, "sb-refresh-token");

  // Fallback till Authorization header (Bearer token)
  const authHeader = c.req.header("authorization");
  const jwt =
    accessToken ??
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined);

  // Skapa Supabase-klient med token
  const client = supa(jwt);

  // 👇 Lägg även till tokens som headers (hjälper särskilt vid server-side miljöer)
  if (jwt) {
    client.auth.setSession({
      access_token: jwt,
      refresh_token: refreshToken ?? "",
    });
  }

  c.set("supa", client);

  // Hämta användardata via Supabase-auth
  const { data } = await client.auth.getUser();
  c.set("authUser", data.user ? { id: data.user.id } : null);

  await next();
};
