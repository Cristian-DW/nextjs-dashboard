import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { playfair } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchInvoicesPages } from '@/app/lib/data';

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query: string;
    currentPage: number;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = searchParams?.currentPage || 1;
  const totalPages = await fetchInvoicesPages(query);
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between mb-8">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Invoices</h1>
        <div className="text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
          {totalPages} {totalPages === 1 ? 'page' : 'pages'}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
