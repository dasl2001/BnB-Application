"use client";
import Guard from "../components/Guard";
import CreateForm from "./components/CreateForm";
import ItemCard from "./components/ItemCard";
import EditModal from "./components/EditModal";
import { useProperties } from "./hooks/useProperties";
export default function MyPropertiesPage() {
  const {
    items,  
    busy, 
    editId, 
    editData, 
    setEditId, 
    setEditData, 
    createProperty, 
    deleteProperty, 
    saveEdit, 
  } = useProperties();
  return (
    <Guard>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Mina listningar</h1>
        <section className="rounded-2xl border p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Skapa nytt boende</h2>
          <CreateForm onCreate={createProperty} busy={busy} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Dina listningar</h2>
          {items.length === 0 ? (
            <p className="text-gray-500 italic">Du har inga listningar ännu.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <li key={p.id}>
                  <ItemCard
                    item={p}
                    onEdit={() => {
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
                    onDelete={() => deleteProperty(p.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <EditModal
        open={!!editId} 
        data={editData} 
        onChange={setEditData} 
        onClose={() => {
          setEditId(null);
          setEditData({});
        }}
        onSave={saveEdit}
      />
    </Guard>
  );
}

