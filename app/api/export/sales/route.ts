import { NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

const PERIOD_MAP: Record<string, string> = {
  today: '1 day',
  week: '7 days',
  month: '30 days',
  quarter: '90 days',
  year: '365 days',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';
  const interval = PERIOD_MAP[period] || PERIOD_MAP.month;

  try {
    const res = await sql`
      SELECT
        s.id,
        TO_CHAR(s.created_at, 'YYYY-MM-DD HH24:MI') AS date_time,
        COALESCE(c.name, 'Walk-in Customer') AS customer,
        s.payment_method,
        (s.subtotal / 100.0)::numeric(10,2) AS subtotal,
        (s.discount_amount / 100.0)::numeric(10,2) AS discount,
        (s.tax_amount / 100.0)::numeric(10,2) AS tax,
        (s.total / 100.0)::numeric(10,2) AS total,
        s.status,
        s.cashier
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.created_at >= NOW() - CAST(${interval} AS INTERVAL)
      ORDER BY s.created_at DESC
    `;

    const headers = ['ID', 'Date/Time', 'Customer', 'Payment Method', 'Subtotal', 'Discount', 'Tax', 'Total', 'Status', 'Cashier'];
    const rows = res.rows.map((r) => [
      r.id, r.date_time, r.customer, r.payment_method,
      r.subtotal, r.discount, r.tax, r.total, r.status, r.cashier,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sales-${period}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
