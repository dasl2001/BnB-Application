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

/* Hjälpfunktion: konverterar värde till number|null */
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
  Custom React Hook för CRUD-logik mot backendens /api/properties-endpoints.
  Sköter endast data och felthrow — UI (t.ex. CreateForm) visar meddelanden.
*/
export function useProperties() {
  const [items, setItems] = useState<WithBooked[]>([]);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MyProperty>>({});

  /* Läs alla boenden från backend */
  const load = useCallback(async () => {
    const base = await api<{ properties: MyProperty[] }>("/api/properties/my");

    const withFlags = await Promise.all(
      (base.properties ?? []).map(async (p) => {
        try {
          const r = await api<{ is_booked: boolean }>(
            `/api/properties/${p.id}/is-booked`
          );
          return { ...p, is_booked: r.is_booked };
        } catch {
          return { ...p, is_booked: false };
        }
      })
    );

    setItems(withFlags);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Skapa nytt boende */
  async function createProperty(payload: {
    name: string;
    description: string | null;
    location: string | null;
    price_per_night: number | null;
    availability: boolean;
    image_url: string | null;
  }) {
    setBusy(true);
    try {
      if (!payload.name.trim()) throw new Error("Namn är obligatoriskt.");
      if (
        payload.price_per_night !== null &&
        (Number.isNaN(payload.price_per_night) || payload.price_per_night < 0)
      ) {
        throw new Error("Pris per natt måste vara ett icke-negativt tal.");
      }

      await api("/api/properties", {
        method: "POST",
        json: payload,
      });

      await load(); // uppdatera listan
    } catch (err) {
      throw err; // låt CreateForm visa fel
    } finally {
      setBusy(false);
    }
  }

  /* Ta bort boende */
  async function deleteProperty(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna listning?")) return;
    try {
      const prev = items;
      setItems((xs) => xs.filter((p) => p.id !== id));
      await api(`/api/properties/${id}`, { method: "DELETE" });
    } catch (err) {
      throw err;
    }
  }

  /* Spara ändringar i boende */
  async function saveEdit() {
    if (!editId) return;

    const name = (editData.name ?? "").toString().trim();
    if (!name) throw new Error("Namn är obligatoriskt.");

    const price = toNullableNumber(editData.price_per_night as unknown);
    if (price !== null && (Number.isNaN(price) || price < 0))
      throw new Error("Pris per natt måste vara ett icke-negativt tal.");

    const payload = {
      name,
      description: (editData.description ?? "").toString().trim() || null,
      location: (editData.location ?? "").toString().trim() || null,
      price_per_night: price,
      availability: Boolean(editData.availability),
      image_url: (editData.image_url ?? "").toString().trim() || null,
    };

    // Optimistisk uppdatering
    setItems((xs) => xs.map((p) => (p.id === editId ? { ...p, ...payload } : p)));

    try {
      await api(`/api/properties/${editId}`, {
        method: "PATCH",
        json: payload,
      });
    } catch (err) {
      await load(); // återställ från servern
      throw err;
    }

    setEditId(null);
    setEditData({});
  }

  return {
    items,
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
