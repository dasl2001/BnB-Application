"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Guard from "../../components/Guard";
import { api } from "@/lib/api";

/* 
  Denna sida visar detaljer för ett specifikt boende (property).
  Den används för att se t.ex. om boendet redan är bokat eller tillgängligt.
  Den hämtar information baserat på ID:t i URL:en – t.ex. `/properties/1234`.
*/
export default function PropertyDetailPage() {
  /* Hämta ID:t från URL-parametern (Next.js hook) */
  const { id } = useParams<{ id: string }>();
   /* React state för bokningsstatus och felmeddelanden */
  const [isBooked, setIsBooked] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");

  /* 
    useEffect() körs när sidan laddas eller när ID:t ändras.
    Här gör vi ett API-anrop till backend för att kontrollera bokningsstatus.
  */
  useEffect(() => {
    (async () => {
      try {
        /* 
        Hämtar data från backend:
        GET /api/properties/:id/is-booked
        Returnerar ett JSON-objekt: { is_booked: boolean }
        */
        const r = await api<{ is_booked: boolean }>(`/api/properties/${id}/is-booked`);
         /* Spara bokningsstatus i state */
        setIsBooked(r.is_booked);
      } catch (e: unknown) {
        /* Hantera eventuella fel (t.ex. nätverksfel, ogiltigt ID, osv.) */
        if (e instanceof Error ) {
                setMsg(e.message || "Kunde inte läsa bokningsstatus.");
        }

      }
    })();
  }, [id]); /* Körs om URL-ID:t ändras (t.ex. när man öppnar en ny property-sida) */

  return (
    /* Guard ser till att bara autentiserade användare får se sidan */
    <Guard>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">Boendedetaljer</h1>
 {/* Felmeddelanden, om något gick fel med API-anropet */}
        {msg && <p className="text-sm text-rose-600">{msg}</p>}
 {/* Visa status baserat på state */}
        {isBooked === null ? (
          /* När status ännu inte har laddats */
          <div className="text-gray-500">Laddar status…</div>
        ) : isBooked ? (
           /* Om boendet är bokat */
          <span className="inline-block text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
            Bokat
          </span>
        ) : (
          /* Om boendet inte är bokat */
          <span className="inline-block text-sm font-medium bg-gray-50 text-gray-700 border px-3 py-1 rounded-full">
            Inte bokat
          </span>
        )}
      </main>
    </Guard>
  );
}
