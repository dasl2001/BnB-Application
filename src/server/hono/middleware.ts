import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import { supa } from "@/lib/supabase";
import type { Vars } from "./types";
export const supabaseMiddleware: MiddlewareHandler<{ Variables: Vars }> = async (c, next) => {
  const accessToken = getCookie(c, "sb-access-token");
  const refreshToken = getCookie(c, "sb-refresh-token");
  const authHeader = c.req.header("authorization");
  const jwt =
    accessToken ??
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined);
  const client = supa(jwt);
  if (jwt) {
    client.auth.setSession({
      access_token: jwt,
      refresh_token: refreshToken ?? "",
    });
  }
  c.set("supa", client);
  const { data } = await client.auth.getUser();
  c.set("authUser", data.user ? { id: data.user.id } : null);
  await next();
};
