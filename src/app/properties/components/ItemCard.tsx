"use client";

import type { WithBooked } from "../hooks/useProperties";

/* 
  Props definierar vad komponenten tar emot:
  - item: själva boendet (Property)
  - onEdit: funktion som anropas när användaren klickar på "Redigera"
  - onDelete: funktion som anropas när användaren klickar på "Ta bort"
*/
type Props = {
  item: WithBooked;
  onEdit: () => void;
  onDelete: () => void;
};

/* 
  En visuell komponent som visar ett boende (Property) som ett kort.
  Den används i `MyPropertiesPage` för att lista alla användarens boenden.
  Varje kort visar:
   - Bild (om någon finns uppladdad)
   - Namn, beskrivning, plats och pris
   - Status (tillgänglig / ej tillgänglig)
   - En knapp för att visa status, redigera eller ta bort
  Den tar emot funktioner (onEdit, onDelete) från parent-komponenten
  som i sin tur kopplas till hooken `useProperties()` — där API-anropen görs.
*/
export default function ItemCard({ item, onEdit, onDelete }: Props) {
  const p = item;  /* Alias för kortare kod */

  return (
    <div className="flex flex-col border rounded-2xl p-4 bg-white shadow-sm h-full">
       {/* Om propertyn har en bild-URL → visa bilden */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Annars visa en platshållare */
          <div className="w-full h-full bg-gray-100 grid place-items-center text-gray-400">
            Ingen bild
          </div>
        )}

{/* Visa en “Bokat”-etikett om boendet har aktiv bokning */}
        {p.is_booked && (
          <span className="absolute top-2 right-2 inline-block text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">
            Bokat
          </span>
        )}
      </div>

      {/* Textinnehåll */}
      <div className="flex-1 mt-3 space-y-1 text-sm text-gray-700">
        {/* Namn */}
        <h3 className="font-semibold text-gray-900 text-base">{p.name}</h3>
         {/* Beskrivning */}
        <p className="line-clamp-2">{p.description || "Ingen beskrivning"}</p>
         {/* Plats */}
        <p className="text-gray-600">{p.location || "—"}</p>
        <p>
           {/* Pris per natt */}
          <span className="font-medium text-gray-900">
            {p.price_per_night != null ? `${p.price_per_night} kr` : "—"}
          </span>{" "}
          / natt
        </p>
          {/* Tillgänglighetsstatus */}
        <p>
          Status:{" "}
          <span
            className={
              p.availability ? "text-emerald-600" : "text-rose-600"
            }
          >
            {p.availability ? "Tillgänglig" : "Ej tillgänglig"}
          </span>
        </p>
      </div>

      {/* Knappar */}
      <div className="pt-3 flex gap-2 flex-wrap">
        {/* Länk till statusvy */}
        <a
          href={`/properties/${p.id}`}
          className="text-sm px-3 py-2 rounded-full border text-gray-700 hover:bg-gray-50"
        >
          Status
        </a>
        {/* Kallar onEdit-funktionen → öppnar EditModal i parent */}
        <button
          onClick={onEdit}
          className="text-sm px-3 py-2 rounded-full border border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          Redigera
        </button>

         {/* Kallar onDelete-funktionen → DELETE /api/properties/:id via useProperties */}
        <button
          onClick={onDelete}
          className="text-sm px-3 py-2 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50"
          aria-label={`Ta bort ${p.name}`}
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}
