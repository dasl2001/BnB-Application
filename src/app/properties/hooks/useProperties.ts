"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/* Typdefinition för en Property (boende) som ägs av användaren */
export type MyProperty = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  price_per_night: number | null;
  availability: boolean;
  image_url?: string | null;
};

/* Typ för Property med extra flagga för bokningsstatus */
export type WithBooked = MyProperty & { is_booked?: boolean };

/* 
  Hjälpfunktion:
  Försöker konvertera en okänd typ (t.ex. från inputfält) till ett giltigt number|null.
*/
function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/* 
  En custom React Hook som hanterar all logik för boenden (Properties).
  Den kommunicerar direkt med backendens API och sköter CRUD-operationerna:
    - Create  → POST /api/properties
    - Read    → GET  /api/properties/my
    - Update  → PATCH /api/properties/:id
    - Delete  → DELETE /api/properties/:id

  Hooken används av sidan `app/properties/page.tsx`
*/
export function useProperties() {
    /* State-variabler */
  const [items, setItems] = useState<WithBooked[]>([]); /* Alla användarens boenden */
  const [msg, setMsg] = useState(""); /* Meddelande (fel eller status) */
  const [busy, setBusy] = useState(false); /* Om en API-förfrågan pågår */
  const [editId, setEditId] = useState<string | null>(null); /* ID för boendet som redigeras */
  const [editData, setEditData] = useState<Partial<MyProperty>>({}); /* Data som redigeras i formuläret */

  /* 
    Funktion för att läsa in alla boenden från backend.
    - Hämtar mina properties via GET /api/properties/my
    - För varje property hämtas även dess bokningsstatus via /api/properties/:id/is-booked
  */
  const load = useCallback(async () => {
    try {
      setMsg(""); /* Rensa gamla felmeddelanden */
       /* Hämtar användarens egna boenden */
      const base = await api<{ properties: MyProperty[] }>("/api/properties/my");

      /* Hämta bokningsstatus för varje property parallellt */
      const withFlags = await Promise.all( 
        (base.properties ?? []).map(async (p) => {
          try {
            const r = await api<{ is_booked: boolean }>(`/api/properties/${p.id}/is-booked`);
            return { ...p, is_booked: r.is_booked };
          } catch {
            return { ...p, is_booked: false };
          }
        })
      );
      setItems(withFlags); /* Uppdatera state med boenden + bokningsstatus */
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Kunde inte hämta dina boenden.");
    }
  }, []);

  /* Körs när komponenten mountas – laddar initial data */
  useEffect(() => {
    void load();
  }, [load]);

    /* 
    Skickar POST /api/properties med formulärdata från CreateForm.
  */
  async function createProperty(payload: {
    name: string;
    description: string | null;
    location: string | null;
    price_per_night: number | null;
    availability: boolean;
    image_url: string | null;
  }) {
    setBusy(true);
    setMsg("");
    try {
            /* Enkel validering innan API-anrop */
      if (!payload.name.trim()) {
        setMsg("Namn är obligatoriskt.");
        return;
      }
      if (payload.price_per_night !== null && (Number.isNaN(payload.price_per_night) || payload.price_per_night < 0)) {
        setMsg("Pris per natt måste vara ett icke-negativt tal.");
        return;
      }

       /* POST till backend för att skapa ny property */
      await api("/api/properties", {
        method: "POST",
        json: payload,
      });

       /* Läs in uppdaterad lista */
      await load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Något gick fel vid skapande.");
    } finally {
      setBusy(false);
    }
  }

    /* 
    Skickar DELETE /api/properties/:id
    Tar bort boendet både i frontend och backend.
  */
  async function deleteProperty(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna listning?")) return;
    try {
      const prev = items;
      setItems((xs) => xs.filter((p) => p.id !== id)); 

      /* Skicka DELETE till backend */
      const res = await api<{ ok: true } | { error: string }>(`/api/properties/${id}`, {
        method: "DELETE",
      }).catch(async (e: unknown) => {
         /* Om det misslyckas → återställ till tidigare state */
        setItems(prev);
        throw e;
      });

      if (!("ok" in res)) {
        setItems(prev);
        setMsg("Kunde inte ta bort boendet.");
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Nätverksfel vid borttagning.");
    }
  }

    /* 
    Skickar PATCH /api/properties/:id med ny data från EditModal.
  */
  async function saveEdit() {
    if (!editId) return;

    try {
      const name = (editData.name ?? "").toString().trim();
      if (!name) {
        setMsg("Namn är obligatoriskt.");
        return;
      }

      const price = toNullableNumber(editData.price_per_night as unknown);
      if (price !== null && (Number.isNaN(price) || price < 0)) {
        setMsg("Pris per natt måste vara ett icke-negativt tal.");
        return;
      }

         /* Skapa nytt payload-objekt som skickas till backend */
      const payload = {
        name,
        description: (editData.description ?? "").toString().trim() || null,
        location: (editData.location ?? "").toString().trim() || null,
        price_per_night: price,
        availability: Boolean(editData.availability),
        image_url: (editData.image_url ?? "").toString().trim() || null,
      };

      /* Optimistisk uppdatering i UI:t */
      setItems((xs) => xs.map((p) => (p.id === editId ? { ...p, ...payload } : p)));

       /* PATCH till backend */
      await api(`/api/properties/${editId}`, {
        method: "PATCH",
        json: payload,
      });

      /* Stäng redigeringsmodalen */
      setEditId(null);
      setEditData({});
    } catch (err: unknown) {
      /* Om något går fel → ladda om från backend för att synka */
      await load();
      setMsg(err instanceof Error ? err.message : "Kunde inte spara ändringarna.");
    }
  }

   /* Returnerar alla funktioner och värden som komponenten använder */
  return {
    items,
    msg,
    busy,
    editId,
    editData,
    setEditId,
    setEditData,
    createProperty,
    deleteProperty,
    saveEdit,
  };
}
