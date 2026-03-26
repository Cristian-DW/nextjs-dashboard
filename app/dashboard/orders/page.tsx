import { sql } from '@/app/lib/db';
import { createPurchaseOrder, receivePurchaseOrder } from '@/app/lib/actions';
import { playfair } from '@/app/ui/fonts';
import Link from 'next/link';
import { TruckIcon, PlusIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

async function getPurchaseOrders() {
  try {
    const res = await sql`
      SELECT po.*, s.name AS supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.created_at DESC
      LIMIT 50
    `;
    return res.rows;
  } catch { return []; }
}

async function getSuppliers() {
  try {
    const res = await sql`SELECT id, name FROM suppliers WHERE is_active = true ORDER BY name ASC`;
    return res.rows;
  } catch { return []; }
}

async function getActiveProducts() {
  try {
    const res = await sql`SELECT id, name, sku FROM products WHERE is_active = true ORDER BY name ASC LIMIT 100`;
    return res.rows;
  } catch { return []; }
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500',
  ordered: 'bg-blue-50 text-blue-600',
  received: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-500',
};

export default async function PurchaseOrdersPage() {
  const [orders, suppliers, products] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getActiveProducts(),
  ]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Purchase Orders</h1>
        <Link href="/dashboard/suppliers" className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <TruckIcon className="w-4 h-4" /> Suppliers
        </Link>
      </div>

      {/* Quick create */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <PlusIcon className="w-4 h-4 text-indigo-500" /> New Purchase Order
        </h2>
        <form action={createPurchaseOrder} className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Supplier *</label>
            <select name="supplier_id" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
              <option value="">— Select supplier —</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expected Date</label>
            <input name="expected_at" type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input name="notes" placeholder="Order details or references"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
              Create Order
            </button>
          </div>
        </form>
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <TruckIcon className="w-12 h-12 mx-auto mb-3" />
            <p>No purchase orders yet. Create your first above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Expected</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Notes</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order: any) => {
                const receiveAction = receivePurchaseOrder.bind(null, order.id);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-semibold text-slate-800">{order.supplier_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-500 hidden sm:table-cell">
                      {order.expected_at ? new Date(order.expected_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{order.notes || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[order.status] || statusColors.draft)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {order.status === 'ordered' && (
                        <form action={receiveAction}>
                          <button type="submit" className="flex items-center gap-1 text-xs font-medium text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                            <CheckBadgeIcon className="w-3.5 h-3.5" /> Mark Received
                          </button>
                        </form>
                      )}
                      {order.status === 'draft' && (
                        <form action={receivePurchaseOrder.bind(null, order.id)}>
                          <input type="hidden" name="set_status" value="ordered" />
                          <button type="submit" className="text-xs font-medium text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                            Mark Ordered
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
