import { sql } from '@/app/lib/db';
import { playfair } from '@/app/ui/fonts';
import Link from 'next/link';
import { getTranslations } from '@/app/lib/i18n/server';
import { ArrowDownTrayIcon, ChartBarIcon, CubeIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/lib/utils';

async function fetchReportData(period: string) {
  const intervalDays: Record<string, number> = {
    today: 1,
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };
  const days = intervalDays[period] ?? 30;

  try {
    const [salesRes, topRes, paymentRes, dailyRes] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total_sales,
          COALESCE(SUM(total), 0) AS revenue,
          COALESCE(AVG(total), 0) AS avg_order,
          COALESCE(SUM(discount_amount), 0) AS total_discounts,
          COALESCE(SUM(tax_amount), 0) AS total_tax
        FROM sales
        WHERE status = 'completed'
          AND created_at >= NOW() - (${days} * INTERVAL '1 day')
      `,
      sql`
        SELECT si.product_name, SUM(si.quantity)::int AS qty, SUM(si.total) AS rev
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.status = 'completed'
          AND s.created_at >= NOW() - (${days} * INTERVAL '1 day')
        GROUP BY si.product_name
        ORDER BY qty DESC
        LIMIT 10
      `,
      sql`
        SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(total),0) AS revenue
        FROM sales
        WHERE status = 'completed'
          AND created_at >= NOW() - (${days} * INTERVAL '1 day')
        GROUP BY payment_method
      `,
      sql`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') AS day,
          COALESCE(SUM(total), 0) AS revenue,
          COUNT(*)::int AS count
        FROM sales
        WHERE status = 'completed'
          AND created_at >= NOW() - (${days} * INTERVAL '1 day')
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
      `,
    ]);

    return {
      summary: salesRes.rows[0],
      topProducts: topRes.rows,
      paymentBreakdown: paymentRes.rows,
      dailyRevenue: dailyRes.rows,
    };
  } catch (e) {
    console.error('Report fetch error:', e);
    return { summary: null, topProducts: [], paymentBreakdown: [], dailyRevenue: [] };
  }
}

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
];

const PMIcons: Record<string, string> = { cash: '💵', card: '💳', transfer: '🏦' };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { period?: string };
}) {
  const period = searchParams?.period || 'month';
  const [{ summary, topProducts, paymentBreakdown }, t] = await Promise.all([
    fetchReportData(period),
    getTranslations(),
  ]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>{t.reports.title}</h1>

        {/* Export buttons */}
        <div className="flex gap-2">
          <a
            href={`/api/export/sales?period=${period}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> {t.reports.exportSales}
          </a>
          <a
            href="/api/export/inventory"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> {t.reports.exportInventory}
          </a>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/dashboard/reports?period=${p.key}`}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              period === p.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {p.key === 'today' ? t.reports.today : p.key === 'week' ? t.reports.week : p.key === 'month' ? t.reports.month : p.key === 'quarter' ? t.reports.quarter : t.reports.year}
          </Link>
        ))}
      </div>

      {/* KPI row */}
      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: t.reports.totalRevenue, value: formatCurrency(Number(summary.revenue)) },
            { label: t.reports.salesCount, value: summary.total_sales.toLocaleString() },
            { label: t.reports.avgOrder, value: formatCurrency(Number(summary.avg_order)) },
            { label: t.reports.totalDiscounts, value: formatCurrency(Number(summary.total_discounts)) },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800">{t.reports.topProducts}</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">{t.reports.noDataPeriod}</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0].qty;
                return (
                  <div key={p.product_name}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 w-5">#{i + 1}</span>
                        <span className="font-medium text-slate-700 truncate max-w-[180px]">{p.product_name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-600">{p.qty} {t.reports.sold}</span>
                        <span className="text-xs text-slate-400 ml-2">{formatCurrency(Number(p.rev))}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CubeIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800">{t.reports.paymentMethods}</h2>
          </div>
          {paymentBreakdown.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">{t.reports.noDataPeriod}</p>
          ) : (
            <div className="space-y-3">
              {paymentBreakdown.map((pm) => {
                const total = paymentBreakdown.reduce((s, p) => s + p.count, 0);
                const pct = Math.round((pm.count / total) * 100);
                return (
                  <div key={pm.payment_method} className="flex items-center gap-3">
                    <span className="text-2xl">{PMIcons[pm.payment_method] || '💰'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 capitalize">{pm.payment_method === 'cash' ? t.pos.cash : pm.payment_method === 'card' ? t.pos.card : pm.payment_method === 'transfer' ? t.pos.transfer : pm.payment_method}</span>
                        <span className="text-slate-500">{pm.count} {t.reports.txns} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{formatCurrency(Number(pm.revenue))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
