"use client";

import { useState } from "react";

/* 
  Props:
   - busy: visar om en nätverksförfrågan pågår (t.ex. API-anrop)
   - onCreate: funktion som kallas när användaren skickar formuläret.
     → Den skickas från `useProperties()` och anropar POST /api/properties
*/
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


/* 
  Formulär för att skapa ett nytt boende (Property).
  Innehåller fält för:
    - namn, plats, beskrivning, pris
    - samt bilduppladdning till Supabase Storage.

  När användaren klickar på “Skapa listning”:
   ev. bild laddas upp till `/api/properties/upload-image`
   backend returnerar en public URL till bilden
   den skickas med i payload till `/api/properties`
*/
export default function CreateForm({ busy, onCreate }: Props) {
   /* Lokala state-variabler */
  const [file, setFile] = useState<File | null>(null);  /* vald bildfil */
  const [preview, setPreview] = useState<string | null>(null); /* förhandsvisning */
  const [msg, setMsg] = useState(""); /* status-/felmeddelande */

    /* 
    uploadImage(): laddar upp en bild till backendens endpoint.
    Backend hanterar bilduppladdning till Supabase Storage-bucket "property-images".
  */
  async function uploadImage(f: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", f);

    /* 
      Skickar POST till vårt Hono-API → /api/properties/upload-image
      Backend sparar bilden i Supabase Storage och returnerar en publik URL.
    */
    const res = await fetch("/api/properties/upload-image", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Kunde inte ladda upp bilden");
    return data.url as string; /* returnerar bildens URL till frontend */
  }

  return (
    <form
      id="new-property-form"
      onSubmit={async (e) => {
        e.preventDefault(); /* förhindra standardformulärbeteende */
        setMsg("");

         /* Läs alla fält från formuläret */
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        const description = String(fd.get("description") ?? "").trim() || null;
        const location = String(fd.get("location") ?? "").trim() || null;
        const price = fd.get("price_per_night")
          ? Number(fd.get("price_per_night"))
          : null;

        try {
          let image_url: string | null = null;

          /* 
            Om användaren valt en bild → ladda upp den via uploadImage()
            Få tillbaka en publik URL att spara i databasen
          */
          if (file) image_url = await uploadImage(file);

          /* 
            Anropa onCreate() → POST /api/properties
            Detta anrop hanteras i useProperties() som i sin tur
            skickar datan vidare till backendens Hono-route.
          */
          await onCreate({
            name,
            description,
            location,
            price_per_night: price,
            availability: true, /* nya boenden är alltid tillgängliga från start */
            image_url,
          });

          /* Nollställ formuläret och visa bekräftelse */
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

      {/* 🔹 Ny: bilduppladdning */}
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
        {/* Visa förhandsvisning om användaren valt en bild */}
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
            className={`text-sm ${
              msg.startsWith("✅") ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {msg}
          </p>
        )}
      </div>
    </form>
  );
}
