/*
Denna fil hanterar alla CRUD-operationer för bokningar:
Skapa ny bokning
Läsa sina egna bokningar
Uppdatera datum
Ta bort bokning
Den använder autentisering via Supabase och kopplar användaren (User) till Property via relationen Booking.
RLS (Row Level Security) ser till att varje användare
Endast ser och ändrar sina egna bokningar.
*/

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { bookingCreate } from "@/lib/schemas";
import { calcTotalPrice } from "@/lib/price";
import { requireAuth, currentUserId, weekStart, weekEnd } from "../utils";
import type { Vars } from "../types";

export const bookings = new Hono<{ Variables: Vars }>();

/*
GET /api/bookings
Hämta alla bokningar som tillhör inloggad användare
*/
bookings.get("/", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);

/*
Hämtar alla bokningar + tillhörande property
*/
  const { data, error } = await db
    .from("bookings")
    .select("*, properties(*)")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ bookings: data });
});

/*
GET /api/bookings/:id
Hämta en specifik bokning (endast egen)
*/
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

  if (error || !data) {
    return c.json({ error: "Bokningen finns inte" }, 404);
  }

  return c.json({ booking: data });
});

/*
POST /api/bookings
Skapa ny bokning
*/
bookings.post("/", zValidator("json", bookingCreate), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { property_id, check_in_date, check_out_date } = c.req.valid("json");

/*
Hämta property och ägare
*/
  const { data: prop, error: pe } = await db
    .from("properties")
    .select("price_per_night, owner_id")
    .eq("id", property_id)
    .single();

  if (pe || !prop) return c.json({ error: "Property not found" }, 404);

  if (prop.owner_id === user_id)
    return c.json({ error: "Du kan inte boka din egen property." }, 400);

/*
Kontrollera överlappande bokningar (user-nivå)
*/
  {
    const { data: myOverlap, error: myOvErr } = await db
      .from("bookings")
      .select("id")
      .eq("user_id", user_id)
      .not("check_out_date", "lte", check_in_date)
      .not("check_in_date", "gte", check_out_date);
    if (myOvErr) return c.json({ error: myOvErr.message }, 400);
    if (myOverlap && myOverlap.length > 0)
      return c.json({ error: "Du har redan en bokning som överlappar dessa datum." }, 400);
  }

/*
Kontrollera om boendet redan är bokat
*/
  {
    const { data: overlaps, error: ovErr } = await db
      .from("bookings")
      .select("id")
      .eq("property_id", property_id)
      .not("check_out_date", "lte", check_in_date)
      .not("check_in_date", "gte", check_out_date);
    if (ovErr) return c.json({ error: ovErr.message }, 400);
    if (overlaps && overlaps.length > 0)
      return c.json({ error: "Datumen är redan bokade för detta boende." }, 400);
  }

/*
Vecko-skydd (en bokning per vecka)
*/
  {
    const weekStartStr = weekStart(check_in_date);
    const weekEndStr = weekEnd(check_out_date);

    const { data: weekOverlapUser, error: wuErr } = await db
      .from("bookings")
      .select("id")
      .eq("user_id", user_id)
      .not("check_out_date", "lte", weekStartStr)
      .not("check_in_date", "gte", weekEndStr);
    if (wuErr) return c.json({ error: wuErr.message }, 400);
    if (weekOverlapUser && weekOverlapUser.length > 0)
      return c.json({ error: "Du har redan en bokning samma vecka." }, 400);
  }

/*
Räkna ut totalpris (pris/natt * antal nätter)
*/
  const total_price = calcTotalPrice(
    Number(prop.price_per_night),
    check_in_date,
    check_out_date
  );

/*

*/
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

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ booking: data }, 201);
});

/*
PATCH /api/bookings/:id
Uppdatera datum på en egen bokning
*/ 
bookings.patch("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { id } = c.req.param();

/*
Hämta ny data
*/
  const body = await c.req.json().catch(() => null);
  const check_in_date: string | undefined = body?.check_in_date;
  const check_out_date: string | undefined = body?.check_out_date;
  if (!check_in_date || !check_out_date)
    return c.json({ error: "check_in_date och check_out_date krävs." }, 400);

/*
Kontrollera att bokningen existerar och tillhör användaren
*/
  const { data: booking, error: bErr } = await db
    .from("bookings")
    .select("id, user_id, property_id")
    .eq("id", id)
    .single();
  if (bErr || !booking) return c.json({ error: "Bokningen finns inte" }, 404);
  if (booking.user_id !== user_id)
    return c.json({ error: "Du saknar behörighet att ändra denna bokning." }, 403);

/*
Hämta property för att kunna räkna om priset
*/
  const { data: prop, error: pErr } = await db
    .from("properties")
    .select("price_per_night")
    .eq("id", booking.property_id)
    .single();
  if (pErr || !prop) return c.json({ error: "Property saknas för bokningen." }, 400);

/*
A) global overlap per user (exkludera denna)
*/
  {
    const { data: myOverlap, error: myOvErr } = await db
      .from("bookings")
      .select("id")
      .eq("user_id", user_id)
      .neq("id", id)
      .not("check_out_date", "lte", check_in_date)
      .not("check_in_date", "gte", check_out_date);
    if (myOvErr) return c.json({ error: myOvErr.message }, 400);
    if (myOverlap && myOverlap.length > 0)
      return c.json({ error: "Du har redan en bokning som överlappar dessa datum." }, 400);
  }

/*
B) overlap på samma property (exkludera denna)
*/
  {
    const { data: overlaps, error: ovErr } = await db
      .from("bookings")
      .select("id")
      .eq("property_id", booking.property_id)
      .neq("id", id)
      .not("check_out_date", "lte", check_in_date)
      .not("check_in_date", "gte", check_out_date);
    if (ovErr) return c.json({ error: ovErr.message }, 400);
    if (overlaps && overlaps.length > 0)
      return c.json({ error: "Datumen är redan bokade för detta boende." }, 400);
  }

/*
C) vecko-skydd (exkludera denna)
*/
  {
    const weekStartStr = weekStart(check_in_date);
    const weekEndStr = weekEnd(check_out_date);

    const { data: w, error: wuErr } = await db
      .from("bookings")
      .select("id")
      .eq("user_id", user_id)
      .neq("id", id)
      .not("check_out_date", "lte", weekStartStr)
      .not("check_in_date", "gte", weekEndStr);
    if (wuErr) return c.json({ error: wuErr.message }, 400);
    if (w && w.length > 0)
      return c.json({ error: "Du har redan en bokning samma vecka." }, 400);
  }

/*
Räkna om pris
*/
  const total_price = calcTotalPrice(
    Number(prop.price_per_night),
    check_in_date,
    check_out_date
  );

/*
Uppdatera
*/
  const { data: updated, error: uErr } = await db
    .from("bookings")
    .update({ check_in_date, check_out_date, total_price })
    .eq("id", id)
    .eq("user_id", user_id)
    .select("*, properties(*)")
    .single();

  if (uErr) return c.json({ error: uErr.message }, 400);
  return c.json({ booking: updated });
});

/*
Ta bort egen bokning 
*/
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
  if (rErr || !booking) return c.json({ error: "Bokningen finns inte" }, 404);
  if (booking.user_id !== user_id)
    return c.json({ error: "Du saknar behörighet att ta bort denna bokning." }, 403);

  const { error: dErr } = await db.from("bookings").delete().eq("id", id);
  if (dErr) return c.json({ error: dErr.message }, 400);
  return c.json({ ok: true });
});
