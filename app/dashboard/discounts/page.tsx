import { sql } from '@/app/lib/db';
import { createDiscountCode, toggleDiscountCode } from '@/app/lib/actions';
import { playfair } from '@/app/ui/fonts';
import { PlusIcon, TagIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/lib/utils';
import clsx from 'clsx';

async function getDiscountCodes() {
  try {
    const res = await sql`SELECT * FROM discount_codes ORDER BY created_at DESC`;
    return res.rows;
  } catch { return []; }
}

export default async function DiscountsPage() {
  const codes = await getDiscountCodes();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Discount Codes</h1>
      </div>

      {/* Create code form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <PlusIcon className="w-4 h-4 text-indigo-500" /> Create New Code
        </h2>
        <form action={createDiscountCode} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Code *</label>
            <input name="code" required placeholder="e.g. SAVE20"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
            <select name="type" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Value *</label>
            <input name="value" type="number" required min="0" step="0.01" placeholder="10"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Uses</label>
            <input name="max_uses" type="number" min="0" placeholder="∞ Unlimited"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <input name="description" placeholder="Internal note about this discount"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
              Create
            </button>
          </div>
        </form>
      </div>

      {/* Codes list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {codes.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <TagIcon className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">No discount codes yet. Create one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Uses</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {codes.map((code: any) => {
                const toggleAction = toggleDiscountCode.bind(null, code.id, !code.is_active);
                const discountDisplay = code.type === 'percentage'
                  ? `${code.value}% off`
                  : `${formatCurrency(code.value)} off`;
                return (
                  <tr key={code.id} className={clsx('hover:bg-slate-50/50 transition-colors', !code.is_active && 'opacity-60')}>
                    <td className="px-5 py-4">
                      <code className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-xs">{code.code}</code>
                    </td>
                    <td className="px-5 py-4 text-slate-500 hidden sm:table-cell">{code.description || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{discountDisplay}</td>
                    <td className="px-5 py-4 text-slate-500 hidden md:table-cell">
                      {code.uses_count} {code.max_uses ? `/ ${code.max_uses}` : ''}
                    </td>
                    <td className="px-5 py-4">
                      {code.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                          <XCircleIcon className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <form action={toggleAction}>
                        <button type="submit" className="text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-colors">
                          {code.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </form>
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
