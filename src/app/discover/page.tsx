"use client";

import { useEffect, useState } from "react";
import Guard from "../components/Guard";
import { api } from "@/lib/api";

/* 
  Typdefinition för ett boende (property) som vi visar på "Upptäck"-sidan.
  Matchar fälten som backend returnerar från tabellen `properties`.
*/
type Prop = {
  id: string;
  name: string;
  description?: string | null;
  price_per_night: number;
  image_url?: string | null;
  location?: string | null;
};

/*
  Denna sida visar alla *andras* boenden (ej användarens egna)
  som är tillgängliga att boka — hämtade från backendens
  endpoint `/api/properties/others`.
  Den används av gäster som vill hitta något att boka.
*/
export default function DiscoverPage() {
  /* React state: lista över boenden + ev. felmeddelande */
  const [items, setItems] = useState<Prop[]>([]);
  const [msg, setMsg] = useState("");

  /*
    useEffect() körs direkt vid sidladdning.
    Gör ett API-anrop till backend för att hämta alla tillgängliga boenden.
  */
  useEffect(() => {
    (async () => {
      try {
        /*
        Hämtar data från vårt Hono API:
        GET /api/properties/others
        Backend filtrerar bort:
        - användarens egna boenden
        - boenden som inte är tillgängliga (availability = false)
        */
        const d = await api<{ properties: Prop[] }>("/api/properties/others");
        /* Spara resultatet i state → rendera i UI:t */
        setItems(d.properties);
      } catch (err: unknown) {
        /* Felhantering vid misslyckad fetch */
        setMsg(err instanceof Error ? err.message : "Kunde inte hämta boenden.");
      }
    })();
  }, []); /* körs bara en gång vid första renderingen */

  return (
    <Guard>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Upptäck boenden</h1>
         {/* Visa ev. felmeddelande */}
        {msg && <p className="text-sm text-rose-600">{msg}</p>}

       {/* Om inga boenden hittas */}
        {items.length === 0 ? (
          <p className="text-gray-500">Inga boenden tillgängliga just nu.</p>
        ) : (

           /* Lista alla tillgängliga boenden i ett grid */
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <li key={p.id} className="border rounded-2xl p-4 bg-white shadow-sm space-y-3">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-40 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-xl grid place-items-center text-gray-400">
                    Ingen bild
                  </div>
                )}
                <h2 className="font-semibold text-gray-900">{p.name}</h2>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {p.description || "Ingen beskrivning"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.price_per_night} kr / natt</span>
                    {/* Länk till bokningssidan med property-ID som query-param */}
                  <a
                    href={`/bookings?property=${p.id}`}
                    className="text-sm px-3 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Boka
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </Guard>
  );
}
