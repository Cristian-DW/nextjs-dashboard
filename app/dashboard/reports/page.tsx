import { sql } from '@/app/lib/db';
import { playfair } from '@/app/ui/fonts';
import Link from 'next/link';
import { ArrowDownTrayIcon, ChartBarIcon, CubeIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/lib/utils';

async function fetchReportData(period: string) {
  const intervals: Record<string, string> = {
    today: '1 day',
    week: '7 days',
    month: '30 days',
    quarter: '90 days',
    year: '365 days',
  };
  const interval = intervals[period] || intervals.month;

  try {
    const [salesRes, topRes, paymentRes] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total_sales,
          COALESCE(SUM(total), 0) AS revenue,
          COALESCE(AVG(total), 0) AS avg_order,
          COALESCE(SUM(discount_amount), 0) AS total_discounts
        FROM sales
        WHERE status = 'completed'
          AND created_at >= NOW() - CAST(${interval} AS INTERVAL)
      `,
      sql`
        SELECT si.product_name, SUM(si.quantity)::int AS qty, SUM(si.total) AS rev
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.status = 'completed'
          AND s.created_at >= NOW() - CAST(${interval} AS INTERVAL)
        GROUP BY si.product_name
        ORDER BY qty DESC
        LIMIT 10
      `,
      sql`
        SELECT payment_method, COUNT(*)::int AS count, SUM(total) AS revenue
        FROM sales
        WHERE status = 'completed'
          AND created_at >= NOW() - CAST(${interval} AS INTERVAL)
        GROUP BY payment_method
      `,
    ]);

    return {
      summary: salesRes.rows[0],
      topProducts: topRes.rows,
      paymentBreakdown: paymentRes.rows,
    };
  } catch (e) {
    return { summary: null, topProducts: [], paymentBreakdown: [] };
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
  const { summary, topProducts, paymentBreakdown } = await fetchReportData(period);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>Reports</h1>

        {/* Export buttons */}
        <div className="flex gap-2">
          <a
            href={`/api/export/sales?period=${period}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Sales CSV
          </a>
          <a
            href="/api/export/inventory"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Inventory CSV
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
            {p.label}
          </Link>
        ))}
      </div>

      {/* KPI row */}
      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: formatCurrency(Number(summary.revenue)) },
            { label: 'Sales Count', value: summary.total_sales.toLocaleString() },
            { label: 'Avg. Order Value', value: formatCurrency(Number(summary.avg_order)) },
            { label: 'Total Discounts', value: formatCurrency(Number(summary.total_discounts)) },
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
            <h2 className="text-sm font-bold text-slate-800">Top Products</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No sales data for this period</p>
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
                        <span className="text-xs font-semibold text-slate-600">{p.qty} sold</span>
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
            <h2 className="text-sm font-bold text-slate-800">Payment Methods</h2>
          </div>
          {paymentBreakdown.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No data for this period</p>
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
                        <span className="font-medium text-slate-700 capitalize">{pm.payment_method}</span>
                        <span className="text-slate-500">{pm.count} txns · {pct}%</span>
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
