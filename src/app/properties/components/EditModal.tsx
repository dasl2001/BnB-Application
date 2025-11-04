"use client";

import type { MyProperty } from "../hooks/useProperties";

/* 
  Props som skickas från parent-komponenten (MyPropertiesPage):
   - open: om modalen ska visas eller döljas
   - data: den nuvarande informationen om boendet (property)
   - onChange: callback som uppdaterar formulärfältens state
   - onSave: callback som sparar ändringarna (PATCH /api/properties/:id)
   - onClose: callback som stänger modalen utan att spara
*/
type Props = {
  open: boolean;
  data: Partial<MyProperty>;
  onChange: (d: Partial<MyProperty>) => void;
  onSave: () => void | Promise<void>;
  onClose: () => void;
};

/* 
  En modal (popup-fönster) som låter användaren redigera sina boenden.
  Den används i `MyPropertiesPage` tillsammans med hooken `useProperties()`.
  All inmatning uppdateras i realtid via `onChange`, och när användaren klickar
  på "Spara" kallas `onSave()` som gör PATCH-anropet till backend.
*/
export default function EditModal({ open, data, onChange, onSave, onClose }: Props) {
   /* Om modalen inte ska visas → returnera null (renderas inte alls) */
  if (!open) return null;

  return (
    /* Bakgrundsöverlägg som täcker hela sidan */
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      {/* Själva modalfönstret */}
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl space-y-4">
        {/* Rubrik och stäng-knapp */}
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Redigera boende</h4>
          <button onClick={onClose} className="rounded-full border px-3 py-1 text-sm">
            Stäng
          </button>
        </div>

 {/* Formulärfält för redigering */}
        <div className="grid gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Namn *</span>
            <input
              className="rounded-md border px-3 py-2"
              value={data.name ?? ""}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
            />
          </label>

{/* Pris per natt */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Pris per natt (SEK)</span>
            <input
              className="rounded-md border px-3 py-2"
              inputMode="numeric"
              value={data.price_per_night ?? ""}
              onChange={(e) => onChange({ ...data, price_per_night: e.target.value as unknown as number })}
            />
          </label>

{/* Plats */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Plats</span>
            <input
              className="rounded-md border px-3 py-2"
              value={data.location ?? ""}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
            />
          </label>

 {/* Beskrivning */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Beskrivning</span>
            <textarea
              className="rounded-md border px-3 py-2 min-h-24"
              value={data.description ?? ""}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
            />
          </label>

{/* Bild-URL */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Bild-URL</span>
            <input
              className="rounded-md border px-3 py-2"
              value={data.image_url ?? ""}
              onChange={(e) => onChange({ ...data, image_url: e.target.value })}
            />
          </label>

{/* Tillgänglighet */}
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={Boolean(data.availability)}
              onChange={(e) => onChange({ ...data, availability: e.target.checked })}
            />
            <span className="text-sm">Tillgänglig</span>
          </label>
        </div>

{/* Knappar i nederkant */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {/* Avbryt: stänger modalen utan att spara */}
          <button onClick={onClose} className="rounded-md border px-4 py-2">
            Avbryt
          </button>

           {/* Spara: kallar onSave() → PATCH till backend via hooken */}
          <button
            onClick={onSave}
            className="rounded-md border px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Spara
          </button>
        </div>
      </div>
    </div>
  );
}
