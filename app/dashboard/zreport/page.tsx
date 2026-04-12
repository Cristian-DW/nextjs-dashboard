import { sql } from '@/app/lib/db';
import { playfair } from '@/app/ui/fonts';
import { formatCurrency } from '@/app/lib/utils';
import Link from 'next/link';
import {
  BanknotesIcon, ShoppingCartIcon, ArrowPathIcon, DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

async function fetchZReport() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [salesRes, paymentRes, topRes, hourlyRes, voidRes] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS total_sales,
               COALESCE(SUM(total), 0) AS gross_revenue,
               COALESCE(SUM(discount_amount), 0) AS total_discounts,
               COALESCE(SUM(tax_amount), 0) AS total_tax,
               COALESCE(AVG(total), 0) AS avg_transaction
        FROM sales WHERE status = 'completed' AND DATE(created_at) = ${today}
      `,
      sql`
        SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(total), 0) AS revenue
        FROM sales WHERE status = 'completed' AND DATE(created_at) = ${today}
        GROUP BY payment_method
      `,
      sql`
        SELECT si.product_name, SUM(si.quantity)::int AS qty, SUM(si.total) AS revenue
        FROM sale_items si JOIN sales s ON s.id = si.sale_id
        WHERE s.status = 'completed' AND DATE(s.created_at) = ${today}
        GROUP BY si.product_name ORDER BY revenue DESC LIMIT 5
      `,
      sql`
        SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
        FROM sales WHERE status = 'completed' AND DATE(created_at) = ${today}
        GROUP BY hour ORDER BY hour
      `,
      sql`
        SELECT COUNT(*)::int AS voided FROM sales WHERE status = 'voided' AND DATE(created_at) = ${today}
      `,
    ]);
    return {
      summary: salesRes.rows[0],
      payments: paymentRes.rows,
      topProducts: topRes.rows,
      hourly: hourlyRes.rows,
      voided: voidRes.rows[0]?.voided || 0,
      date: today,
    };
  } catch {
    return null;
  }
}

const PM_ICON: Record<string, string> = { cash: '💵', card: '💳', transfer: '🏦' };

export default async function ZReportPage() {
  const data = await fetchZReport();
  const now = new Date();

  if (!data || !data.summary) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-slate-400">No sales data found for today.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-indigo-500 hover:underline text-sm">← Back to Dashboard</Link>
      </div>
    );
  }

  const { summary, payments, topProducts, voided } = data;
  const netRevenue = Number(summary.gross_revenue) - Number(summary.total_discounts);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`${playfair.className} text-2xl md:text-3xl font-bold text-slate-900`}>
            End of Day Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Z-Report · {new Date(data.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export/sales?period=today`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <DocumentArrowDownIcon className="w-4 h-4" /> Export CSV
          </a>
        </div>
      </div>

      {/* Generated time */}
      <div className="bg-slate-800 text-slate-300 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-xs font-mono">
        <ArrowPathIcon className="w-3.5 h-3.5" />
        Report generated: {now.toLocaleString()} · Shift: All day
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Gross Revenue', value: formatCurrency(Number(summary.gross_revenue)), icon: BanknotesIcon, color: 'indigo' },
          { label: 'Net Revenue', value: formatCurrency(netRevenue), icon: BanknotesIcon, color: 'emerald' },
          { label: 'Total Sales', value: summary.total_sales, icon: ShoppingCartIcon, color: 'violet' },
          { label: 'Total Discounts', value: formatCurrency(Number(summary.total_discounts)), icon: BanknotesIcon, color: 'amber' },
          { label: 'Total Tax', value: formatCurrency(Number(summary.total_tax)), icon: BanknotesIcon, color: 'slate' },
          { label: 'Avg. Transaction', value: formatCurrency(Number(summary.avg_transaction)), icon: BanknotesIcon, color: 'slate' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{k.label}</p>
              <p className="text-xl font-extrabold text-slate-900">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Payment breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Payment Breakdown</h2>
        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-slate-400 text-sm">No payments today</p>
          ) : payments.map((p: any) => (
            <div key={p.payment_method} className="flex items-center gap-3">
              <span className="text-2xl">{PM_ICON[p.payment_method] || '💰'}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700 capitalize">{p.payment_method}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(Number(p.revenue))}</span>
                </div>
                <p className="text-xs text-slate-400">{p.count} transaction{p.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Top Products Today</h2>
          <div className="space-y-2">
            {topProducts.map((p: any, i: number) => (
              <div key={p.product_name} className="flex items-center gap-3 text-sm">
                <span className="text-xs font-bold text-slate-300 w-5">#{i + 1}</span>
                <span className="font-medium text-slate-700 flex-1 truncate">{p.product_name}</span>
                <span className="text-slate-500">{p.qty} sold</span>
                <span className="font-bold text-slate-900 w-20 text-right">{formatCurrency(Number(p.revenue))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voided */}
      {voided > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
          ⚠️ <strong>{voided}</strong> sale{voided !== 1 ? 's' : ''} voided today
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 mt-6 pb-4">
        Deltux POS · End of Day Z-Report · {now.toLocaleDateString()}
      </div>
    </div>
  );
}
