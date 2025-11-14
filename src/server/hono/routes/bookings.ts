import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { bookingCreate } from "@/lib/schemas";
import { calcTotalPrice } from "@/lib/price";
import { requireAuth, currentUserId, weekStart, weekEnd } from "../utils";
import type { Vars } from "../types";
export const bookings = new Hono<{ Variables: Vars }>();
bookings.get("/", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;
  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { data, error } = await db
    .from("bookings")
    .select("*, properties(*)")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ bookings: data });
});
bookings.get("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;
  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const id = c.req.param("id");
  const { data, error } = await db
    .from("bookings")
    .select("*, properties(*)")
    .eq("id", id)
    .eq("user_id", user_id)
    .single();
  if (error || !data) return c.json({ error: "Bokningen finns inte" }, 404);
  return c.json({ booking: data });
});
bookings.post("/", zValidator("json", bookingCreate), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;
  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { property_id, check_in_date, check_out_date } = c.req.valid("json");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);
  if (checkIn < today)
    return c.json({ error: "Du kan inte boka datum som redan har passerat." }, 400);
  if (checkOut <= checkIn)
    return c.json({ error: "Utcheckningsdatum måste vara efter incheckning." }, 400);
  const { data: prop, error: pe } = await db
    .from("properties")
    .select("price_per_night, owner_id")
    .eq("id", property_id)
    .single();
  if (pe || !prop) return c.json({ error: "Boendet kunde inte hittas." }, 404);
  if (prop.owner_id === user_id)
    return c.json({ error: "Du kan inte boka ditt eget boende." }, 400);
  const { data: myOverlap } = await db
    .from("bookings")
    .select("id")
    .eq("user_id", user_id)
    .not("check_out_date", "lte", check_in_date)
    .not("check_in_date", "gte", check_out_date);
  if (myOverlap && myOverlap.length > 0)
    return c.json({ error: "Du har redan en bokning som överlappar dessa datum." }, 400);
  const weekStartStr = weekStart(check_in_date);
  const weekEndStr = weekEnd(check_out_date);
  const { data: weekOverlapUser } = await db
    .from("bookings")
    .select("id")
    .eq("user_id", user_id)
    .not("check_out_date", "lte", weekStartStr)
    .not("check_in_date", "gte", weekEndStr);
  if (weekOverlapUser && weekOverlapUser.length > 0)
    return c.json({ error: "Du har redan en bokning samma vecka." }, 400);
  const total_price = calcTotalPrice(
    Number(prop.price_per_night),
    check_in_date,
    check_out_date
  );
  const { data, error } = await db
    .from("bookings")
    .insert({
      user_id,
      property_id,
      check_in_date,
      check_out_date,
      total_price,
    })
    .select("*, properties(*)")
    .single();
  if (error) {
    const msg = String(error.message || "");
    if (
      msg.includes("bookings_no_overlap_per_property") ||
      msg.includes("overlap") ||
      msg.includes("prevent_booking_overlap") ||
      msg.includes("Boendet är redan bokat")
    ) {
      return c.json({ error: "Datumen är redan bokade för detta boende." }, 400);
    }
    return c.json({ error: msg }, 400);
  }
  return c.json({ booking: data }, 201);
});
bookings.patch("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;
  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const check_in_date: string | undefined = body?.check_in_date;
  const check_out_date: string | undefined = body?.check_out_date;
  if (!check_in_date || !check_out_date)
    return c.json({ error: "check_in_date och check_out_date krävs." }, 400);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);
  if (checkIn < today)
    return c.json({ error: "Du kan inte boka datum som redan har passerat." }, 400);
  if (checkOut <= checkIn)
    return c.json({ error: "Utcheckningsdatum måste vara efter incheckning." }, 400);
  const { data: booking, error: bErr } = await db
    .from("bookings")
    .select("id, user_id, property_id")
    .eq("id", id)
    .single();
  if (bErr || !booking) return c.json({ error: "Bokningen finns inte." }, 404);
  if (booking.user_id !== user_id)
    return c.json({ error: "Du saknar behörighet att ändra denna bokning." }, 403);
  const { data: prop, error: pErr } = await db
    .from("properties")
    .select("price_per_night")
    .eq("id", booking.property_id)
    .single();
  if (pErr || !prop)
    return c.json({ error: "Boendet saknas för denna bokning." }, 400);
  const total_price = calcTotalPrice(
    Number(prop.price_per_night),
    check_in_date,
    check_out_date
  );
  const { data: updated, error: uErr } = await db
    .from("bookings")
    .update({ check_in_date, check_out_date, total_price })
    .eq("id", id)
    .eq("user_id", user_id)
    .select("*, properties(*)")
    .single();
  if (uErr) {
    const msg = String(uErr.message || "");
    if (
      msg.includes("bookings_no_overlap_per_property") ||
      msg.includes("overlap") ||
      msg.includes("prevent_booking_overlap") ||
      msg.includes("Boendet är redan bokat")
    ) {
      return c.json({ error: "Datumen är redan bokade för detta boende." }, 400);
    }
    return c.json({ error: msg }, 400);
  }
  return c.json({ booking: updated });
});
bookings.delete("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;
  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { id } = c.req.param();
  const { data: booking, error: rErr } = await db
    .from("bookings")
    .select("id, user_id")
    .eq("id", id)
    .single();
  if (rErr || !booking) return c.json({ error: "Bokningen finns inte." }, 404);
  if (booking.user_id !== user_id)
    return c.json({ error: "Du saknar behörighet att ta bort denna bokning." }, 403);
  const { error: dErr } = await db.from("bookings").delete().eq("id", id);
  if (dErr) return c.json({ error: dErr.message }, 400);
  return c.json({ ok: true });
});


