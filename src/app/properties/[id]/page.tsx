"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Guard from "../../components/Guard";
import { api } from "@/lib/api";
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [isBooked, setIsBooked] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const r = await api<{ is_booked: boolean }>(`/api/properties/${id}/is-booked`);
        setIsBooked(r.is_booked);
      } catch (e: unknown) {
        if (e instanceof Error ) {
                setMsg(e.message || "Kunde inte läsa bokningsstatus.");
        }
      }
    })();
  }, [id]); 
  return (
    <Guard>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">Boendedetaljer</h1>
        {msg && <p className="text-sm text-rose-600">{msg}</p>}
        {isBooked === null ? (
          <div className="text-gray-500">Laddar status…</div>
        ) : isBooked ? (
          <span className="inline-block text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
            Bokat
          </span>
        ) : (
          <span className="inline-block text-sm font-medium bg-gray-50 text-gray-700 border px-3 py-1 rounded-full">
            Inte bokat
          </span>
        )}
      </main>
    </Guard>
  );
}
