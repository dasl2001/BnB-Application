"use client";
import type { MyProperty } from "../hooks/useProperties";
type Props = {
  open: boolean;
  data: Partial<MyProperty>;
  onChange: (d: Partial<MyProperty>) => void;
  onSave: () => void | Promise<void>;
  onClose: () => void;
};
export default function EditModal({ open, data, onChange, onSave, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Redigera boende</h4>
          <button onClick={onClose} className="rounded-full border px-3 py-1 text-sm">
            Stäng
          </button>
        </div>
        <div className="grid gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Namn *</span>
            <input
              className="rounded-md border px-3 py-2"
              value={data.name ?? ""}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Pris per natt (SEK)</span>
            <input
              className="rounded-md border px-3 py-2"
              inputMode="numeric"
              value={data.price_per_night ?? ""}
              onChange={(e) => onChange({ ...data, price_per_night: e.target.value as unknown as number })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Plats</span>
            <input
              className="rounded-md border px-3 py-2"
              value={data.location ?? ""}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Beskrivning</span>
            <textarea
              className="rounded-md border px-3 py-2 min-h-24"
              value={data.description ?? ""}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Bild-URL</span>
            <input
              className="rounded-md border px-3 py-2"
              value={data.image_url ?? ""}
              onChange={(e) => onChange({ ...data, image_url: e.target.value })}
            />
          </label>
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
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2">
            Avbryt
          </button>
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
