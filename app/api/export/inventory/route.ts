import { NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

export async function GET() {
  try {
    const res = await sql`
      SELECT
        p.sku,
        p.name,
        c.name AS category,
        (p.price / 100.0)::numeric(10,2) AS price,
        p.stock,
        p.low_stock_threshold,
        CASE WHEN p.stock = 0 THEN 'Out of Stock'
             WHEN p.stock <= p.low_stock_threshold THEN 'Low Stock'
             ELSE 'In Stock' END AS stock_status,
        TO_CHAR(p.created_at, 'YYYY-MM-DD') AS added_date
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.stock ASC, p.name ASC
    `;

    const headers = ['SKU', 'Name', 'Category', 'Price (USD)', 'Stock', 'Low Stock Threshold', 'Status', 'Added Date'];
    const rows = res.rows.map((r) => [
      r.sku || '', r.name, r.category || '', r.price, r.stock, r.low_stock_threshold, r.stock_status, r.added_date,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
