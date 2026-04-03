import { sql } from '@/app/lib/db';
import { createSupplier, deleteSupplier } from '@/app/lib/actions';
import { playfair } from '@/app/ui/fonts';
import Link from 'next/link';
import { PlusIcon, EnvelopeIcon, PhoneIcon, TruckIcon, TrashIcon } from '@heroicons/react/24/outline';

async function getSuppliers() {
  try {
    const res = await sql`SELECT * FROM suppliers WHERE is_active = true ORDER BY name ASC`;
    return res.rows;
  } catch { return []; }
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Suppliers</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/orders" className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <TruckIcon className="w-4 h-4" /> Purchase Orders
          </Link>
          <Link href="/dashboard/suppliers/create" className="flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
            <PlusIcon className="w-4 h-4" /> Add Supplier
          </Link>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
          <TruckIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">No suppliers yet.</p>
          <Link href="/dashboard/suppliers/create" className="mt-3 inline-block text-sm text-indigo-500 hover:underline">Add your first supplier →</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s: any) => {
            const deleteAction = deleteSupplier.bind(null, s.id);
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <TruckIcon className="w-5 h-5 text-indigo-500" />
                  </div>
                  <form action={deleteAction}>
                    <button type="submit" className="text-slate-300 hover:text-red-400 transition-colors p-1">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </form>
                </div>
                <h3 className="font-bold text-slate-800">{s.name}</h3>
                {s.contact_name && <p className="text-sm text-slate-500 mt-0.5">{s.contact_name}</p>}
                <div className="mt-3 space-y-1.5">
                  {s.email && (
                    <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                      <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" /> {s.email}
                    </a>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <PhoneIcon className="w-3.5 h-3.5 shrink-0" /> {s.phone}
                    </div>
                  )}
                </div>
                {s.notes && <p className="text-xs text-slate-400 mt-3 border-t border-slate-50 pt-3">{s.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
