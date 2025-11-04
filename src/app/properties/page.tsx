/* 
Gör att komponenten körs på klientsidan (React Hooks stöds här) 
*/
"use client";

/* 
Skyddar sidan - kräver att användaren är inloggad 
*/
import Guard from "../components/Guard";

/* 
Formulär för att skapa nya boenden 
*/
import CreateForm from "./components/CreateForm";

/* 
Visar varje boende som ett kort 
*/
import ItemCard from "./components/ItemCard";

/* 
Modal för att redigera befintligt boende 
*/
import EditModal from "./components/EditModal";

/* 
Hook som hanterar CRUD-logiken mot backend 
*/
import { useProperties } from "./hooks/useProperties";

/* 
Den här sidan visar alla boenden ("properties") som tillhör den inloggade användaren.
Sidan använder hooken `useProperties()` för att:
Hämta användarens boenden från backend (/api/properties/my)
Skapa nya boenden (/api/properties)
Uppdatera boenden (/api/properties/:id)
Ta bort boenden (/api/properties/:id)
All kommunikation med backend sker via fetch i api.ts  som i sin tur pratar med Hono-API:t (servern) och Supabase.
*/
export default function MyPropertiesPage() {
  const {
    items,  /* Lista med användarens properties från backend */
    //msg, /* Felmeddelanden eller status från API */
    busy, /* Laddningsstatus (true under pågående API-anrop) */
    editId, /* ID för boendet som redigeras just nu */
    editData, /* Formdata för boendet som redigeras */
    setEditId, /* Funktion för att öppna/stänga redigeringsmodulen */
    setEditData, /* Funktion för att uppdatera formulärdata vid redigering */
    createProperty, /* Funktion som anropar API för att skapa nytt boende */
    deleteProperty, /* Funktion som anropar API för att ta bort boende */
    saveEdit, /* Funktion som anropar API för att spara ändringar */
  } = useProperties();

  return (
    /* Guard gör att sidan bara visas om användaren är inloggad */
    <Guard>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Mina listningar</h1>

         {/* Visa ev. felmeddelande från API */}


 {/* Sektion: Skapa nytt boende */}
        <section className="rounded-2xl border p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Skapa nytt boende</h2>

          {/* Formuläret skickar data till createProperty → backend POST /api/properties */}
          <CreateForm onCreate={createProperty} busy={busy} />
        </section>

 {/* Sektion: Visa alla befintliga listningar */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Dina listningar</h2>

  {/* Om inga properties finns */}
          {items.length === 0 ? (
            <p className="text-gray-500 italic">Du har inga listningar ännu.</p>
          ) : (

              /* Annars, rendera alla boenden som ItemCards */
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <li key={p.id}>
                  <ItemCard
                    item={p}
                    onEdit={() => {

                       /* När användaren klickar på “Redigera” öppnas modalen */
                      setEditId(p.id);
                      setEditData({
                        name: p.name ?? "",
                        description: p.description ?? "",
                        location: p.location ?? "",
                        price_per_night: p.price_per_night ?? null,
                        availability: p.availability,
                        image_url: p.image_url ?? "",
                      });
                    }}

                    /* När användaren klickar “Ta bort” → DELETE /api/properties/:id */
                    onDelete={() => deleteProperty(p.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

        {/*Redigeringsmodal */}
      <EditModal
        open={!!editId} /* Visa modalen om ett boende är valt för redigering */
        data={editData} /* Formulärdata som användaren kan ändra */
        onChange={setEditData} /* Uppdatera lokalt när användaren skriver i fälten */
        onClose={() => {
           /* Stäng modal och nollställ state */
          setEditId(null);
          setEditData({});
        }}

         /* När användaren klickar “Spara” → PATCH /api/properties/:id */
        onSave={saveEdit}
      />
    </Guard>
  );
}

