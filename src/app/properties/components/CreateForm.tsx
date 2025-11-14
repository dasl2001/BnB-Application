"use client";
import { useEffect, useState } from "react";
type Props = {
  busy?: boolean;
  onCreate: (payload: {
    name: string;
    description: string | null;
    location: string | null;
    price_per_night: number | null;
    availability: boolean;
    image_url: string | null;
  }) => Promise<void>;
};
export default function CreateForm({ busy, onCreate }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [fade, setFade] = useState(false); 
  async function uploadImage(f: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", f);

    const res = await fetch("/api/properties/upload-image", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Kunde inte ladda upp bilden");
    return data.url as string;
  }
  useEffect(() => {
    if (!msg) return;
    setFade(false); 
    const t1 = setTimeout(() => setFade(true), 2500); 
    const t2 = setTimeout(() => setMsg(""), 4000); 
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [msg]);
  return (
    <form
      id="new-property-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg("");
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        const description = String(fd.get("description") ?? "").trim() || null;
        const location = String(fd.get("location") ?? "").trim() || null;
        const price = fd.get("price_per_night")
          ? Number(fd.get("price_per_night"))
          : null;
        try {
          let image_url: string | null = null;
          if (file) image_url = await uploadImage(file);
          await onCreate({
            name,
            description,
            location,
            price_per_night: price,
            availability: true,
            image_url,
          });
          setFile(null);
          setPreview(null);
          setMsg("Boendet skapades!");
          (document.getElementById("new-property-form") as HTMLFormElement)?.reset();
        } catch (err: unknown) {
          const e = err as Error;
          setMsg(`❌ ${e.message}`);
        }
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Namn *</span>
        <input
          name="name"
          required
          className="rounded-md border px-3 py-2"
          placeholder="Mysig stuga"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">Pris per natt (SEK)</span>
        <input
          name="price_per_night"
          inputMode="numeric"
          placeholder="1200"
          className="rounded-md border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-sm text-gray-700">Plats</span>
        <input
          name="location"
          placeholder="Åre, Sverige"
          className="rounded-md border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-sm text-gray-700">Beskrivning</span>
        <textarea
          name="description"
          placeholder="Kort beskrivning av boendet…"
          className="rounded-md border px-3 py-2 min-h-24"
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-sm text-gray-700">Bild</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="rounded-md border px-3 py-2"
        />
        {preview && (
          <img
            src={preview}
            alt="Förhandsvisning"
            className="mt-2 h-40 w-full object-cover rounded-md"
          />
        )}
      </label>
      <div className="sm:col-span-2 flex flex-col gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border px-4 py-2 hover:bg-gray-100 disabled:opacity-60"
        >
          {busy ? "Skapar…" : "Skapa listning"}
        </button>
        {msg && (
          <p
            className={`text-sm transition-opacity duration-1000 ${
              msg.startsWith("✅")
                ? "text-emerald-600"
                : "text-rose-600"
            } ${fade ? "opacity-0" : "opacity-100"}`}
          >
            {msg}
          </p>
        )}
      </div>
    </form>
  );
}




