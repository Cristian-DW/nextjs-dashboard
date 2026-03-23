import { fetchFilteredCustomers } from '@/app/lib/data';
import { playfair } from '@/app/ui/fonts';
import Search from '@/app/ui/search';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/app/lib/utils';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const query = searchParams?.query || '';
  const customers = await fetchFilteredCustomers(query);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Customers</h1>
        <Link
          href="/dashboard/customers/create"
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">New Customer</span>
        </Link>
      </div>

      <div className="mb-5">
        <Search placeholder="Search customers…" />
      </div>

      {/* Stats bar */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Customers', value: customers.length },
          { label: 'Total Revenue', value: formatCurrency(customers.reduce((s, c) => s + Number(c.total_paid.replace(/[^0-9.-]+/g, '')) * 100, 0)) },
          { label: 'Total Transactions', value: customers.reduce((s, c) => s + c.total_invoices, 0).toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Customer table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-slate-400">
            <UserIcon className="w-12 h-12 mb-3" />
            <p>No customers found.</p>
            <Link href="/dashboard/customers/create" className="mt-3 text-sm text-indigo-500 hover:underline">
              Add your first customer →
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transactions</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={customer.image_url}
                          alt={customer.name}
                          width={36}
                          height={36}
                          className="rounded-full border border-slate-200 object-cover"
                        />
                        <span className="font-semibold text-slate-800">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{customer.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {customer.total_invoices} orders
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-600">{customer.total_paid}</td>
                    <td className="px-5 py-4">
                      {customer.total_pending !== '$0.00' ? (
                        <span className="text-amber-600 font-semibold">{customer.total_pending}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-50">
              {customers.map((customer) => (
                <div key={customer.id} className="px-4 py-4 flex items-center gap-3">
                  <Image src={customer.image_url} alt={customer.name} width={44} height={44} className="rounded-full border border-slate-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{customer.name}</p>
                    <p className="text-xs text-slate-400 truncate">{customer.email}</p>
                    <p className="text-xs text-slate-500 mt-1">{customer.total_invoices} orders · <span className="text-emerald-600 font-medium">{customer.total_paid}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
