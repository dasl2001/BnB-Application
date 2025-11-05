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
  Denna hook hanterar:
- Hämtning av alla boenden som ägs av användaren
- Skapande av nytt boende
- Uppdatering av befintligt boende
- Radering av boende
Hooken använder backendens API och hanterar endast datalogiken.
UI-komponenter (som CreateForm) ansvarar för att visa meddelanden till användaren.
*/
export function useProperties() {
  /* Lista av användarens boenden */
  const [items, setItems] = useState<WithBooked[]>([]);
  /* Flagga för att indikera laddning eller pågående åtgärd */
  const [busy, setBusy] = useState(false);
    /* Hantering av redigering */
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MyProperty>>({});

  /* Läs alla boenden från backend */
  const load = useCallback(async () => {
      /* Hämta användarens egna boenden */
    const base = await api<{ properties: MyProperty[] }>("/api/properties/my");
 /* För varje boende — kontrollera om det är bokat (använder /is-booked) */
    const withFlags = await Promise.all(
      (base.properties ?? []).map(async (p) => {
        try {
          const r = await api<{ is_booked: boolean }>(
            `/api/properties/${p.id}/is-booked`
          );
           /* Om API-anropet misslyckas, anta att boendet inte är bokat */
          return { ...p, is_booked: r.is_booked };
        } catch {
          return { ...p, is_booked: false };
        }
      })
    );
  /* Uppdatera state med boenden + bokningsstatus */
    setItems(withFlags);
  }, []);
 /* Kör load() vid första renderingen */
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
      /* Grundläggande validering innan anrop till backend */
      if (!payload.name.trim()) throw new Error("Namn är obligatoriskt.");
      if (
        payload.price_per_night !== null &&
        (Number.isNaN(payload.price_per_night) || payload.price_per_night < 0)
      ) {
        throw new Error("Pris per natt måste vara ett icke-negativt tal.");
      }
      /* Skicka data till backend för att skapa nytt boende */
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
     /* Bekräfta borttagning med användaren */
    if (!confirm("Är du säker på att du vill ta bort denna listning?")) return;
    try {
      /* Optimistisk uppdatering — ta bort direkt från listan */
      const prev = items;
      setItems((xs) => xs.filter((p) => p.id !== id));
      /* Anropa backend för att radera i databasen */
      await api(`/api/properties/${id}`, { method: "DELETE" });
    } catch (err) {
      throw err;
    }
  }

  /* Spara ändringar i boende */
  async function saveEdit() {
    /* Ingen redigering vald */
    if (!editId) return;

    const name = (editData.name ?? "").toString().trim();
    if (!name) throw new Error("Namn är obligatoriskt.");

    const price = toNullableNumber(editData.price_per_night as unknown);
    if (price !== null && (Number.isNaN(price) || price < 0))
      throw new Error("Pris per natt måste vara ett icke-negativt tal.");
  /* Förbered payload att skicka till backend */
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
       /* Uppdatera på servern */
      await api(`/api/properties/${editId}`, {
        method: "PATCH",
        json: payload,
      });
    } catch (err) {
      /* Om fel uppstår — ladda om från servern för att återställa */
      await load(); // återställ från servern
      throw err;
    }
 /* Nollställ redigeringsläge */
    setEditId(null);
    setEditData({});
  }

  return {
    items,  // alla boenden med ev. bokningsflagga
    busy, // indikerar laddning
    editId, // id för boende som redigeras
    editData, // data för boende som redigeras
    setEditId, // sätt id för boende som redigeras
    setEditData, // sätt data för boende som redigeras
    createProperty, // skapa nytt boende
    deleteProperty, // ta bort boende
    saveEdit, // spara ändringar i boende
  };
}
