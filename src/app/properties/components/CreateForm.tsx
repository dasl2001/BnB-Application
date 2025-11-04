"use client";
import { useEffect, useState } from "react";
/*
Denna komponent används för att skapa nya boenden ("properties").
Den hanterar:
- Formulär för inmatning av data
- Bilduppladdning via API
- Förhandsvisning av vald bild
- Dynamiska statusmeddelanden (med fade-effekt)
*/

type Props = {
  /* Busy flagga för att blockera knappen under pågående skapande */
  busy?: boolean;
  /* Callback-funktion som körs när formuläret skickas (backend-anrop) */
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
   /* Lokal state för vald fil, bildförhandsvisning och meddelanden */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [fade, setFade] = useState(false); // styr fade-ut-animation

  /* Ladda upp bild till API: /api/properties/upload-image                   */
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

  // Fade-bort-meddelanden efter 4 sekunder
  useEffect(() => {
    if (!msg) return;
    setFade(false); // startar som synligt
    const t1 = setTimeout(() => setFade(true), 2500); // // börja faden efter 2,5 sek
    const t2 = setTimeout(() => setMsg(""), 4000); // ta bort helt efter 4 sek
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
           /* Läs in data från formuläret */
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        const description = String(fd.get("description") ?? "").trim() || null;
        const location = String(fd.get("location") ?? "").trim() || null;
        const price = fd.get("price_per_night")
          ? Number(fd.get("price_per_night"))
          : null;

        try {
           /* Ladda upp vald bild till servern (om en finns) */
          let image_url: string | null = null;
          if (file) image_url = await uploadImage(file);
          /* Skicka datan till parent-funktionen som hanterar API-anropet */
          await onCreate({
            name,
            description,
            location,
            price_per_night: price,
            availability: true,
            image_url,
          });
          /* Rensa formuläret vid lyckad skapelse */
          setFile(null);
          setPreview(null);
          setMsg("✅ Boendet skapades!");
          (document.getElementById("new-property-form") as HTMLFormElement)?.reset();
        } catch (err: unknown) {
          const e = err as Error;
          // Visa endast ett felmeddelande åt gången
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

      {/* Bilduppladdning */}
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
         {/* Bildförhandsvisning (om användaren har valt en bild) */}
        {preview && (
          <img
            src={preview}
            alt="Förhandsvisning"
            className="mt-2 h-40 w-full object-cover rounded-md"
          />
        )}
      </label>

      {/* Skapa-knapp + meddelande */}
      <div className="sm:col-span-2 flex flex-col gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border px-4 py-2 hover:bg-gray-100 disabled:opacity-60"
        >
          {busy ? "Skapar…" : "Skapa listning"}
        </button>
 {/* Dynamiskt meddelande (lyckat/fel) med fade-effekt */}
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




