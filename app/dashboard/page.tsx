import { fetchAnalyticsSummary, fetchTopProducts, fetchDailyRevenue, fetchHourlySales } from '@/app/lib/data';
import { playfair, inter } from '@/app/ui/fonts';
import { formatCurrency } from '@/app/lib/utils';
import Link from 'next/link';
import { getTranslations } from '@/app/lib/i18n/server';
import {
  BanknotesIcon, ShoppingCartIcon, CubeIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default async function DashboardPage() {
  const [summary, topProducts, dailyRevenue, hourlySales, t] = await Promise.all([
    fetchAnalyticsSummary(),
    fetchTopProducts(5),
    fetchDailyRevenue(14),
    fetchHourlySales(),
    getTranslations(),
  ]);

  const maxRevenue = Math.max(...dailyRevenue.map((d) => Number(d.revenue)), 1);
  const maxHourly = Math.max(...hourlySales.map((h) => h.sale_count), 1);
  const maxTopRevenue = Math.max(...topProducts.map((p) => Number(p.total_revenue)), 1);

  const kpis = [
    { label: t.dashboard.totalRevenue, value: formatCurrency(summary.totalRevenue), icon: BanknotesIcon, color: 'indigo', sub: t.dashboard.allCompletedSales },
    { label: t.dashboard.totalSales, value: summary.totalSales.toLocaleString(), icon: ShoppingCartIcon, color: 'emerald', sub: t.dashboard.completedTransactions },
    { label: t.dashboard.avgOrder, value: formatCurrency(summary.avgOrderValue), icon: ArrowTrendingUpIcon, color: 'violet', sub: t.dashboard.perTransaction },
    { label: t.dashboard.itemsSold, value: summary.totalItemsSold.toLocaleString(), icon: CubeIcon, color: 'amber', sub: t.dashboard.totalUnits },
  ];

  return (
    <main className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>{t.dashboard.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.dashboard.welcome}</p>
        </div>
        <Link href="/dashboard/pos"
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
          <ShoppingCartIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t.dashboard.openTerminal}</span>
        </Link>
      </div>

      {/* Low stock alert */}
      {summary.lowStockCount > 0 && (
        <Link href="/dashboard/inventory" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            <span className="font-bold">{summary.lowStockCount} </span> {t.dashboard.lowStockAlert}
            <span className="underline ml-1">{t.dashboard.manageInventory}</span>
          </p>
        </Link>
      )}

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const colorMap: Record<string, string> = {
            indigo: 'bg-indigo-50 text-indigo-500 ring-indigo-100',
            emerald: 'bg-emerald-50 text-emerald-500 ring-emerald-100',
            violet: 'bg-violet-50 text-violet-500 ring-violet-100',
            amber: 'bg-amber-50 text-amber-500 ring-amber-100',
          };
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center ring-4 mb-4', colorMap[kpi.color])}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              <p className={`${inter.className} text-2xl font-extrabold text-slate-900 mt-1`}>{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart + Top Products */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5">{t.dashboard.revenueLast14}</h2>
          {dailyRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">{t.dashboard.noSalesData}</div>
          ) : (
            <div className="flex items-end gap-1.5 h-48">
              {dailyRevenue.map((d) => {
                const h = Math.max(4, (Number(d.revenue) / maxRevenue) * 100);
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t-lg bg-indigo-500 group-hover:bg-indigo-600 transition-all cursor-default"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[9px] text-slate-400 rotate-45 origin-left hidden sm:block">{d.day}</span>
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {formatCurrency(Number(d.revenue))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5">{t.dashboard.topProducts}</h2>
          {topProducts.length === 0 ? (
            <div className="text-center text-slate-300 text-sm py-10">{t.dashboard.noDataYet}</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.product_name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
                      <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">{p.product_name}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium shrink-0">{p.total_quantity} sold</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${(Number(p.total_revenue) / maxTopRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hourly heatmap */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-5">{t.dashboard.salesHeatmap}</h2>
        <div className="flex items-end gap-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const data = hourlySales.find((h) => h.hour === hour);
            const count = data?.sale_count || 0;
            const intensity = maxHourly > 0 ? count / maxHourly : 0;
            const bg = intensity === 0 ? 'bg-slate-100' :
              intensity < 0.25 ? 'bg-indigo-100' :
                intensity < 0.5 ? 'bg-indigo-300' :
                  intensity < 0.75 ? 'bg-indigo-500' : 'bg-indigo-700';
            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className={clsx('w-full rounded-md transition-all cursor-default', bg)} style={{ height: '36px' }} />
                <span className="text-[9px] text-slate-400">{hour}h</span>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                  {count} sale{count !== 1 ? 's' : ''} at {hour}:00
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: t.dashboard.posTerminal, href: '/dashboard/pos', emoji: '🖥️', desc: t.dashboard.startNewSale },
          { label: t.dashboard.addProduct, href: '/dashboard/products/create', emoji: '📦', desc: t.dashboard.addToCatalog },
          { label: t.nav.inventory, href: '/dashboard/inventory', emoji: '📊', desc: t.dashboard.checkStockLevels },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-indigo-200 transition-all group">
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{item.label}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
