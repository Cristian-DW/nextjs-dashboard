import { fetchInventory } from '@/app/lib/data';
import { adjustStock } from '@/app/lib/actions';
import { playfair } from '@/app/ui/fonts';
import Search from '@/app/ui/search';
import Pagination from '@/app/ui/invoices/pagination';
import { formatCurrency } from '@/app/lib/utils';
import clsx from 'clsx';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';

export default async function InventoryPage({
    searchParams,
}: {
    searchParams?: { query?: string; page?: string };
}) {
    const query = searchParams?.query || '';
    const page = Number(searchParams?.page) || 1;
    const products = await fetchInventory(query, page);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Inventory</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage product stock levels</p>
                </div>
            </div>

            <div className="mb-4">
                <Search placeholder="Search products…" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {products.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-3" />
                        <p>No products found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">SKU</th>
                                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Price</th>
                                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Adjust</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.map((p) => {
                                const isOut = p.stock === 0;
                                const isLow = p.stock > 0 && p.stock <= p.low_stock_threshold;
                                const addAction = adjustStock.bind(null, p.id, 10);
                                const removeAction = adjustStock.bind(null, p.id, -1);
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-800">{p.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 hidden sm:table-cell">{p.sku || '—'}</td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            {p.category_name && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: p.category_color || '#6b7280' }}>
                                                    {p.category_name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={clsx('font-bold text-base', isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-600')}>
                                                    {p.stock}
                                                </span>
                                                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                                                    isOut ? 'bg-red-50 text-red-500' :
                                                        isLow ? 'bg-amber-50 text-amber-600' :
                                                            'bg-emerald-50 text-emerald-700'
                                                )}>
                                                    {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                                                </span>
                                            </div>
                                            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1.5">
                                                <div
                                                    className={clsx('h-1.5 rounded-full transition-all', isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-400')}
                                                    style={{ width: `${Math.min(100, (p.stock / Math.max(p.low_stock_threshold * 4, 20)) * 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-700 font-medium hidden sm:table-cell">{formatCurrency(p.price)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <form action={removeAction}>
                                                    <button type="submit" className="px-2 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">−1</button>
                                                </form>
                                                <form action={addAction}>
                                                    <button type="submit" className="px-2 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">+10</button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-5 flex justify-center">
                <Pagination totalPages={Math.ceil(products.length / 10) || 1} />
            </div>
        </div>
    );
}
