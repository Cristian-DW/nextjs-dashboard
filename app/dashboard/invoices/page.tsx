import { fetchSales, fetchSalesPages } from '@/app/lib/data';
import { voidSale } from '@/app/lib/actions';
import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import { playfair } from '@/app/ui/fonts';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/app/lib/utils';
import clsx from 'clsx';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  voided: 'bg-red-50 text-red-500',
  refunded: 'bg-amber-50 text-amber-600',
};

const paymentIcons: Record<string, string> = {
  cash: '💵',
  card: '💳',
  transfer: '🏦',
};

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string; status?: string };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const statusFilter = searchParams?.status;

  const [sales, totalPages] = await Promise.all([
    fetchSales(query, currentPage, statusFilter),
    fetchSalesPages(query, statusFilter),
  ]);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between mb-6">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Sales History</h1>
        <Link href="/dashboard/pos"
          className="flex items-center gap-2 h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
          <ShoppingCartIcon className="w-4 h-4" />
          <span className="hidden sm:inline">New Sale</span>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'completed', 'voided', 'refunded'].map((s) => (
          <Link key={s} href={`/dashboard/invoices?status=${s}&query=${query}`}
            className={clsx('px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize', {
              'bg-indigo-600 text-white border-indigo-600': (statusFilter || 'all') === s,
              'bg-white text-slate-600 border-slate-200 hover:border-indigo-300': (statusFilter || 'all') !== s,
            })}>
            {s}
          </Link>
        ))}
      </div>

      <div className="mb-4">
        <Search placeholder="Search by customer or payment…" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {sales.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <ShoppingCartIcon className="w-12 h-12 mx-auto mb-3" />
            <p>No sales found.</p>
            <Link href="/dashboard/pos" className="mt-3 inline-block text-sm text-indigo-500 hover:underline">Make your first sale →</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Customer</span>
              <span>Date & Time</span>
              <span>Items</span>
              <span>Payment</span>
              <span>Total</span>
            </div>
            {sales.map((sale) => {
              const voidAction = voidSale.bind(null, sale.id);
              return (
                <div key={sale.id} className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] items-center px-5 py-4 hover:bg-slate-50/50 transition-colors gap-y-1">
                  <div className="flex items-center gap-3">
                    {sale.customer_image ? (
                      <Image src={sale.customer_image} alt={sale.customer_name || ''} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {(sale.customer_name || 'W')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{sale.customer_name || 'Walk-in'}</p>
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', statusColors[sale.status] || statusColors.completed)}>
                        {sale.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 hidden md:block">
                    {new Date(sale.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600 hidden md:block">
                    {sale.item_count} item{sale.item_count !== 1 ? 's' : ''}
                  </div>
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-600">
                    <span>{paymentIcons[sale.payment_method] || '💰'}</span>
                    <span className="capitalize">{sale.payment_method}</span>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(sale.total)}</span>
                    {sale.status === 'completed' && (
                      <form action={voidAction}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Void</button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
