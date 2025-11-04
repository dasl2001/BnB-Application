"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Guard from "../components/Guard";
import { api } from "@/lib/api";
/* 
  Dessa används för att få tydlig typning på datan vi hämtar från API:t.
*/
type Prop = { id: string; name: string; price_per_night: number };
type Booking = {
  id: string;
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  properties?: { name: string };
};

/*
  Denna komponent hanterar:
  Hämtning av användarens bokningar
  Hämtning av bokningsbara boenden (andras properties)
  Skapa nya bokningar
  Redigera och ta bort befintliga bokningar
  Visa totalpris (beräknat i backend)
*/
export default function BookingsClient() {
  const sp = useSearchParams();
  const [others, setOthers] = useState<Prop[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editIn, setEditIn] = useState<string>("");
  const [editOut, setEditOut] = useState<string>("");

    /*
    useEffect: laddar både andras properties och egna bokningar när sidan öppnas.
    Hämtar data via ditt API-lager (`/api/properties/others` och `/api/bookings`).
   */
  useEffect(() => {
    (async () => {
      try {
        const o = await api<{ properties: Prop[] }>("/api/properties/others");
        setOthers(o.properties);
        const b = await api<{ bookings: Booking[] }>("/api/bookings");
        setBookings(b.bookings);
      } catch (err: unknown) {
        setMsg(err instanceof Error ? err.message : "Kunde inte hämta data.");
      }
    })();
  }, []);

  const pre = sp.get("property") || ""; // Förifyller property vid bokningslänk
/* Öppnar redigeringsmodalen med vald bokning */
  function openEdit(b: Booking) {
    setMsg("");
    setEditId(b.id);
    setEditIn(b.check_in_date);
    setEditOut(b.check_out_date);
  }
/* Sparar ändringar till backend via PATCH /api/bookings/:id */
  async function saveEdit() {
    if (!editId) return;
    setMsg("");
    try {
      /* Optimistisk uppdatering: ändra direkt i UI */
      setBookings((xs) =>
        xs.map((bk) =>
          bk.id === editId
            ? { ...bk, check_in_date: editIn, check_out_date: editOut }
            : bk
        )
      );
      
       /* Skicka ändring till backend */
      const d = await api<{ booking: Booking }>(`/api/bookings/${editId}`, {
        method: "PATCH",
        json: {
          check_in_date: editIn,
          check_out_date: editOut,
        },
      });

      /* Uppdatera totalpris från serverns svar */
      setBookings((xs) => xs.map((bk) => (bk.id === editId ? d.booking : bk)));
      setEditId(null);
    } catch (err: unknown) {
      setMsg(`❌ ${err instanceof Error ? err.message : "Kunde inte spara."}`);
    }
  }

  return (
    <Guard>
      {/* Guard säkerställer att bara inloggade användare ser detta innehåll */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Mina bokningar</h1>

        {/* skapa ny bokning */}
        <form
          className="bg-white border rounded-2xl shadow-sm p-6 space-y-4"
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setMsg("");
            const form = e.currentTarget;
            const f = new FormData(form);
            const property_id = String(f.get("property_id") ?? "");
            const check_in_date = String(f.get("check_in_date") ?? "");
            const check_out_date = String(f.get("check_out_date") ?? "");
            try {
              const d = await api<{ booking: Booking }>("/api/bookings", {
                method: "POST",
                json: { property_id, check_in_date, check_out_date },
              });
              setBookings((prev) => [d.booking, ...prev]);
              form.reset?.();
              setMsg("✅ Bokning skapad!");
            } catch (err: unknown) {
              setMsg(`❌ ${err instanceof Error ? err.message : "Kunde inte boka."}`);
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              name="property_id"
              defaultValue={pre}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            >
              <option value="">Välj boende</option>
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price_per_night} kr/natt
                </option>
              ))}
            </select>
            <input
              type="date"
              name="check_in_date"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
            <input
              type="date"
              name="check_out_date"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>
          <button className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-full font-semibold">
            Boka
          </button>
          {msg && (
            <p
              className={`text-sm ${
                msg.startsWith("✅") ? "text-green-600" : "text-rose-600"
              }`}
            >
              {msg}
            </p>
          )}
        </form>

        {/* lista bokningar */}
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-gray-500 italic">Inga bokningar ännu.</p>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="border rounded-xl p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {b.properties?.name ?? b.property_id}
                  </div>
                  <div className="text-sm text-gray-600">
                    {b.check_in_date} → {b.check_out_date}
                  </div>
                  <div className="text-rose-600 font-semibold mt-1">
                    {b.total_price} kr
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="text-sm font-medium text-blue-700 border border-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full transition"
                  >
                    Redigera
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api(`/api/bookings/${b.id}`, { method: "DELETE" });
                        setBookings((prev) => prev.filter((x) => x.id !== b.id));
                      } catch (err: unknown) {
                        setMsg(`❌ ${err instanceof Error ? err.message : "Kunde inte ta bort."}`);
                      }
                    }}
                    className="text-sm font-medium text-rose-600 hover:text-rose-700 border border-rose-600 hover:bg-rose-50 px-4 py-2 rounded-full transition"
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Edit-modal */}
      {editId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Redigera bokning</h4>
              <button
                onClick={() => setEditId(null)}
                className="rounded-full border px-3 py-1 text-sm"
              >
                Stäng
              </button>
            </div>

            <div className="grid gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm">Check-in</span>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2"
                  value={editIn}
                  onChange={(e) => setEditIn(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">Check-out</span>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2"
                  value={editOut}
                  onChange={(e) => setEditOut(e.target.value)}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setEditId(null)} className="rounded-md border px-4 py-2">
                Avbryt
              </button>
              <button
                onClick={() => void saveEdit()}
                className="rounded-md border px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
    </Guard>
  );
}
