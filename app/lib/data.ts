import { sql } from './db';
import {
  CustomerField,
  CustomersTable,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  Product,
  Category,
  SalesTable,
  TopProduct,
  DailyRevenue,
  HourlyData,
  AnalyticsSummary,
  SaleWithItems,
} from './definitions';
import { formatCurrency } from './utils';

// ─────────────────────────────────────────
// LEGACY INVOICE FUNCTIONS (kept for compat)
// ─────────────────────────────────────────

export async function fetchRevenue() {
  try {
    const data = await sql<Revenue>`SELECT * FROM revenue`;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 10;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        TO_CHAR(invoices.date, 'Mon DD, YYYY') ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return invoices.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      TO_CHAR(invoices.date, 'Mon DD, YYYY') ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;
    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status,
        invoices.due_date
      FROM invoices
      WHERE invoices.id = ${id};
    `;
    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      amount: invoice.amount / 100,
    }));
    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT id, name FROM customers ORDER BY name ASC
    `;
    return data.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTable>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;
    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

// ─────────────────────────────────────────
// POS — PRODUCTS
// ─────────────────────────────────────────

export async function fetchProducts(query: string = '', page: number = 1, categoryId?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  try {
    const rows = await sql<Product>`
      SELECT
        p.id, p.name, p.description, p.price, p.category_id,
        c.name AS category_name, c.color AS category_color,
        p.sku, p.stock, p.low_stock_threshold, p.image_url, p.is_active, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE
        p.is_active = true AND
        (${query === '' ? 'true' : 'false'} = 'true' OR
          p.name ILIKE ${`%${query}%`} OR
          p.sku ILIKE ${`%${query}%`} OR
          p.description ILIKE ${`%${query}%`}
        ) AND
        (${!categoryId ? 'true' : 'false'} = 'true' OR p.category_id = ${categoryId || ''})
      ORDER BY p.name ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return rows.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch products.');
  }
}

export async function fetchAllActiveProducts(query: string = '') {
  try {
    const rows = await sql<Product>`
      SELECT
        p.id, p.name, p.description, p.price, p.category_id,
        c.name AS category_name, c.color AS category_color,
        p.sku, p.stock, p.low_stock_threshold, p.image_url, p.is_active, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE
        p.is_active = true AND
        (${query === '' ? 'true' : 'false'} = 'true' OR
          p.name ILIKE ${`%${query}%`} OR
          p.sku ILIKE ${`%${query}%`}
        )
      ORDER BY c.name ASC, p.name ASC
      LIMIT 200
    `;
    return rows.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch products.');
  }
}

export async function fetchProductById(id: string) {
  try {
    const rows = await sql<Product>`
      SELECT p.*, c.name AS category_name, c.color AS category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `;
    return rows.rows[0] || null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch product.');
  }
}

export async function fetchProductsPages(query: string = '', categoryId?: string) {
  try {
    const count = await sql`
      SELECT COUNT(*) FROM products p
      WHERE p.is_active = true AND
        (${query === '' ? 'true' : 'false'} = 'true' OR
          p.name ILIKE ${`%${query}%`} OR p.sku ILIKE ${`%${query}%`}
        ) AND
        (${!categoryId ? 'true' : 'false'} = 'true' OR p.category_id = ${categoryId || ''})
    `;
    return Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
  } catch (error) {
    throw new Error('Failed to fetch products pages.');
  }
}

export async function fetchCategories() {
  try {
    const rows = await sql<Category>`SELECT * FROM categories ORDER BY name ASC`;
    return rows.rows;
  } catch (error) {
    throw new Error('Failed to fetch categories.');
  }
}

// ─────────────────────────────────────────
// POS — SALES
// ─────────────────────────────────────────

export async function fetchSales(query: string = '', page: number = 1, status?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  try {
    const rows = await sql<SalesTable>`
      SELECT
        s.id,
        COALESCE(c.name, 'Walk-in Customer') AS customer_name,
        c.image_url AS customer_image,
        s.total,
        s.payment_method,
        s.status,
        COUNT(si.id)::int AS item_count,
        s.created_at
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      WHERE
        (${query === '' ? 'true' : 'false'} = 'true' OR
          COALESCE(c.name, '') ILIKE ${`%${query}%`} OR
          s.payment_method ILIKE ${`%${query}%`}
        ) AND
        (${!status || status === 'all' ? 'true' : 'false'} = 'true' OR s.status = ${status || ''})
      GROUP BY s.id, c.name, c.image_url
      ORDER BY s.created_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return rows.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch sales.');
  }
}

export async function fetchSalesPages(query: string = '', status?: string) {
  try {
    const count = await sql`
      SELECT COUNT(DISTINCT s.id) FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE
        (${query === '' ? 'true' : 'false'} = 'true' OR
          COALESCE(c.name, '') ILIKE ${`%${query}%`}
        ) AND
        (${!status || status === 'all' ? 'true' : 'false'} = 'true' OR s.status = ${status || ''})
    `;
    return Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
  } catch (error) {
    throw new Error('Failed to count sales pages.');
  }
}

export async function fetchSaleById(id: string): Promise<SaleWithItems | null> {
  try {
    const saleRes = await sql<any>`
      SELECT s.*, COALESCE(c.name, 'Walk-in Customer') AS customer_name, c.image_url AS customer_image
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ${id}
    `;
    if (!saleRes.rows[0]) return null;
    const itemsRes = await sql<any>`SELECT * FROM sale_items WHERE sale_id = ${id}`;
    return { ...saleRes.rows[0], items: itemsRes.rows };
  } catch (error) {
    throw new Error('Failed to fetch sale.');
  }
}

// ─────────────────────────────────────────
// POS — ANALYTICS
// ─────────────────────────────────────────

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const [salesRes, itemsRes, lowStockRes] = await Promise.all([
      sql`
        SELECT
          COALESCE(SUM(total), 0) AS total_revenue,
          COUNT(*) AS total_sales,
          COALESCE(AVG(total), 0) AS avg_order_value
        FROM sales WHERE status = 'completed'
      `,
      sql`SELECT COALESCE(SUM(quantity), 0) AS total_items FROM sale_items`,
      sql`SELECT COUNT(*) AS low_stock FROM products WHERE stock <= low_stock_threshold AND is_active = true`,
    ]);

    return {
      totalRevenue: Number(salesRes.rows[0].total_revenue),
      totalSales: Number(salesRes.rows[0].total_sales),
      avgOrderValue: Number(salesRes.rows[0].avg_order_value),
      totalItemsSold: Number(itemsRes.rows[0].total_items),
      lowStockCount: Number(lowStockRes.rows[0].low_stock),
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return { totalRevenue: 0, totalSales: 0, avgOrderValue: 0, totalItemsSold: 0, lowStockCount: 0 };
  }
}

export async function fetchDailyRevenue(days: number = 14): Promise<DailyRevenue[]> {
  try {
    const rows = await sql<DailyRevenue>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') AS day,
        COALESCE(SUM(total), 0) AS revenue
      FROM sales
      WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `;
    return rows.rows;
  } catch (error) {
    console.error('Daily revenue error:', error);
    return [];
  }
}

export async function fetchTopProducts(limit: number = 5): Promise<TopProduct[]> {
  try {
    const rows = await sql<TopProduct>`
      SELECT
        si.product_name,
        SUM(si.quantity)::int AS total_quantity,
        SUM(si.total) AS total_revenue
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE s.status = 'completed'
      GROUP BY si.product_name
      ORDER BY total_quantity DESC
      LIMIT ${limit}
    `;
    return rows.rows;
  } catch (error) {
    console.error('Top products error:', error);
    return [];
  }
}

export async function fetchHourlySales(): Promise<HourlyData[]> {
  try {
    const rows = await sql<HourlyData>`
      SELECT
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*)::int AS sale_count
      FROM sales
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY hour
      ORDER BY hour ASC
    `;
    return rows.rows;
  } catch (error) {
    console.error('Hourly sales error:', error);
    return [];
  }
}

// ─────────────────────────────────────────
// POS — INVENTORY
// ─────────────────────────────────────────

export async function fetchInventory(query: string = '', page: number = 1) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  try {
    const rows = await sql<Product>`
      SELECT p.*, c.name AS category_name, c.color AS category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE
        p.is_active = true AND
        (${query === '' ? 'true' : 'false'} = 'true' OR
          p.name ILIKE ${`%${query}%`} OR p.sku ILIKE ${`%${query}%`}
        )
      ORDER BY p.stock ASC, p.name ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return rows.rows;
  } catch (error) {
    throw new Error('Failed to fetch inventory.');
  }
}
