"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
export type MyProperty = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  price_per_night: number | null;
  availability: boolean;
  image_url?: string | null;
};
export type WithBooked = MyProperty & { is_booked?: boolean };
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
export function useProperties() {
  const [items, setItems] = useState<WithBooked[]>([]);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MyProperty>>({});
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
      await load(); 
    } catch (err) {
      throw err; 
    } finally {
      setBusy(false);
    }
  }
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
    setItems((xs) => xs.map((p) => (p.id === editId ? { ...p, ...payload } : p)));
    try {
      await api(`/api/properties/${editId}`, {
        method: "PATCH",
        json: payload,
      });
    } catch (err) {
      await load(); 
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
