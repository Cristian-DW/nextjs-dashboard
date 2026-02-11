import { Suspense } from 'react';
import { fetchCardData, fetchLatestInvoices, fetchRevenue } from '../lib/data';

import { Card } from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { inter, playfair } from '@/app/ui/fonts';
import { LatestInvoicesSkeleton, RevenueChartSkeleton } from '../ui/skeletons';

export default async function Page() {
  const latestInvoices = await fetchLatestInvoices();
  const {
    numberOfInvoices,
    numberOfCustomers,
    totalPaidInvoices,
    totalPendingInvoices,
  } = await fetchCardData();
  return (
    <main className="w-full">
      <div className="flex w-full items-center justify-between mb-8">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>
          Dashboard
        </h1>
        <div className="text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
          Overview
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Collected" value={totalPaidInvoices} type="collected" />
        <Card title="Pending" value={totalPendingInvoices} type="pending" />
        <Card title="Total Invoices" value={numberOfInvoices} type="invoices" />
        <Card
          title="Total Customers"
          value={numberOfCustomers}
          type="customers"
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices latestInvoices={latestInvoices} />
        </Suspense>
      </div>
    </main>
  );
}
