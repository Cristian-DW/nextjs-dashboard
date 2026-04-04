'use server';

import { z } from 'zod';
import { sql } from './db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { CartItem } from './definitions';

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

// ─────────────────────────────────────────
// LEGACY INVOICES
// ─────────────────────────────────────────

const InvoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: 'Please select a customer.' }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], { invalid_type_error: 'Please select an invoice status.' }),
  date: z.string(),
});
const CreateInvoiceSchema = InvoiceFormSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = InvoiceFormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoiceSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch { return { message: 'Database Error: Failed to Create Invoice.' }; }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoiceSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  try {
    await sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}`;
  } catch { return { message: 'Database Error: Failed to Update Invoice.' }; }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch { return { message: 'Database Error: Failed to Delete Invoice.' }; }
}

// ─────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────

const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  description: z.string().optional(),
  price: z.coerce.number().gt(0, 'Price must be greater than 0.'),
  category_id: z.string().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.'),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  image_url: z.string().optional(),
});

export async function createProduct(formData: FormData) {
  const parsed = ProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    category_id: formData.get('category_id') || undefined,
    sku: formData.get('sku') || undefined,
    stock: formData.get('stock'),
    low_stock_threshold: formData.get('low_stock_threshold'),
    image_url: formData.get('image_url') || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: 'Validation failed.' };
  const { name, description, price, category_id, sku, stock, low_stock_threshold, image_url } = parsed.data;
  const priceInCents = Math.round(price * 100);
  try {
    await sql`
      INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold, image_url)
      VALUES (${name}, ${description || null}, ${priceInCents}, ${category_id || null}, ${sku || null}, ${stock}, ${low_stock_threshold}, ${image_url || null})
    `;
  } catch { return { message: 'Database Error: Failed to create product.' }; }
  revalidatePath('/dashboard/products');
  redirect('/dashboard/products');
}

export async function updateProduct(id: string, formData: FormData) {
  const parsed = ProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    category_id: formData.get('category_id') || undefined,
    sku: formData.get('sku') || undefined,
    stock: formData.get('stock'),
    low_stock_threshold: formData.get('low_stock_threshold'),
    image_url: formData.get('image_url') || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: 'Validation failed.' };
  const { name, description, price, category_id, sku, stock, low_stock_threshold, image_url } = parsed.data;
  const priceInCents = Math.round(price * 100);
  try {
    await sql`
      UPDATE products SET name = ${name}, description = ${description || null}, price = ${priceInCents},
        category_id = ${category_id || null}, sku = ${sku || null}, stock = ${stock},
        low_stock_threshold = ${low_stock_threshold}, image_url = ${image_url || null}
      WHERE id = ${id}
    `;
  } catch { return { message: 'Database Error: Failed to update product.' }; }
  revalidatePath('/dashboard/products');
  redirect('/dashboard/products');
}

export async function deleteProduct(id: string) {
  try {
    await sql`UPDATE products SET is_active = false WHERE id = ${id}`;
    revalidatePath('/dashboard/products');
    return { message: 'Product deactivated.' };
  } catch { return { message: 'Database Error: Failed to delete product.' }; }
}

export async function adjustStock(productId: string, delta: number) {
  try {
    await sql`UPDATE products SET stock = GREATEST(0, stock + ${delta}) WHERE id = ${productId}`;
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch { return { message: 'Database Error: Failed to adjust stock.' }; }
}

// ─────────────────────────────────────────
// SALES / CHECKOUT
// ─────────────────────────────────────────

export async function createSale(data: {
  customer_id?: string;
  items: CartItem[];
  discount_amount: number;
  tax_rate: number;
  payment_method: 'cash' | 'card' | 'transfer';
  cash_tendered: number;
  notes?: string;
}) {
  const subtotal = data.items.reduce((sum, i) => sum + i.total, 0);
  const discountCents = Math.round(data.discount_amount * 100);
  const taxCents = Math.round((subtotal - discountCents) * (data.tax_rate / 100));
  const total = subtotal - discountCents + taxCents;
  const cashTenderedCents = Math.round(data.cash_tendered * 100);
  const changeGiven = Math.max(0, cashTenderedCents - total);

  try {
    const saleRes = await sql`
      INSERT INTO sales (customer_id, subtotal, discount_amount, tax_amount, total, payment_method, cash_tendered, change_given, notes, cashier)
      VALUES (${data.customer_id || null}, ${subtotal}, ${discountCents}, ${taxCents}, ${total},
        ${data.payment_method}, ${cashTenderedCents}, ${changeGiven}, ${data.notes || null}, 'Admin')
      RETURNING id
    `;
    const saleId = saleRes.rows[0].id;
    await Promise.all(
      data.items.map((item) =>
        Promise.all([
          sql`INSERT INTO sale_items (sale_id, product_id, product_name, sku, quantity, unit_price, total)
              VALUES (${saleId}, ${item.product_id}, ${item.name}, ${item.sku || null}, ${item.quantity}, ${item.price}, ${item.total})`,
          sql`UPDATE products SET stock = GREATEST(0, stock - ${item.quantity}) WHERE id = ${item.product_id}`,
        ])
      )
    );
    revalidatePath('/dashboard/pos');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
    return { success: true, saleId, total, changeGiven };
  } catch (error) {
    console.error('Sale creation error:', error);
    return { success: false, message: 'Failed to create sale.' };
  }
}

export async function voidSale(id: string) {
  try {
    // Restore stock for all items in this sale
    const items = await sql`SELECT product_id, quantity FROM sale_items WHERE sale_id = ${id}`;
    await Promise.all([
      sql`UPDATE sales SET status = 'voided' WHERE id = ${id}`,
      ...items.rows.map((item) =>
        sql`UPDATE products SET stock = stock + ${item.quantity} WHERE id = ${item.product_id}`
      ),
    ]);
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch { return { message: 'Database Error: Failed to void sale.' }; }
}

// ─────────────────────────────────────────
// DISCOUNT CODE VALIDATION (called from client)
// ─────────────────────────────────────────

export async function validateDiscountCode(code: string, orderTotal: number) {
  try {
    const res = await sql`
      SELECT * FROM discount_codes
      WHERE code = ${code.toUpperCase()} AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR uses_count < max_uses)
        AND ${orderTotal} >= min_amount
    `;
    if (res.rows.length === 0) return { valid: false, message: 'Invalid or expired code.' };
    const dc = res.rows[0];
    const discount = dc.type === 'percentage'
      ? Math.round(orderTotal * (dc.value / 100))
      : dc.value;
    return { valid: true, discount, type: dc.type, value: dc.value, id: dc.id };
  } catch {
    return { valid: false, message: 'Could not validate code.' };
  }
}

// ─────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────

export async function createCustomer(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = (formData.get('phone') as string) || null;
  const address = (formData.get('address') as string) || null;

  if (!name?.trim() || !email?.trim()) {
    return { message: 'Name and email are required.' };
  }
  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name.trim()}, ${email.trim().toLowerCase()}, '/customers/default.png')
    `;
  } catch (e: any) {
    if (e.message?.includes('unique')) return { message: 'A customer with that email already exists.' };
    return { message: 'Database Error: Failed to create customer.' };
  }
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

// ─────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────

export async function saveSettings(formData: FormData) {
  const keys = ['business_name', 'business_phone', 'business_address', 'currency',
    'default_tax_rate', 'default_low_stock', 'receipt_footer'];
  try {
    await Promise.all(
      keys.map((key) => {
        const value = (formData.get(key) as string) ?? '';
        return sql`
          INSERT INTO settings (key, value) VALUES (${key}, ${value})
          ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
        `;
      })
    );
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
  } catch { return { message: 'Failed to save settings.' }; }
  redirect('/dashboard/settings');
}

// ─────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────

export async function createSupplier(formData: FormData) {
  const name = formData.get('name') as string;
  if (!name?.trim()) return { message: 'Name is required.' };
  try {
    await sql`
      INSERT INTO suppliers (name, contact_name, email, phone, address, notes)
      VALUES (${name.trim()}, ${formData.get('contact_name') || null}, ${formData.get('email') || null},
        ${formData.get('phone') || null}, ${formData.get('address') || null}, ${formData.get('notes') || null})
    `;
  } catch { return { message: 'Database Error: Failed to create supplier.' }; }
  revalidatePath('/dashboard/suppliers');
  redirect('/dashboard/suppliers');
}

export async function deleteSupplier(id: string) {
  try {
    await sql`UPDATE suppliers SET is_active = false WHERE id = ${id}`;
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch { return { message: 'Failed to delete supplier.' }; }
}

// ─────────────────────────────────────────
// DISCOUNT CODES (admin)
// ─────────────────────────────────────────

export async function createDiscountCode(formData: FormData) {
  const code = (formData.get('code') as string)?.toUpperCase().trim();
  const type = formData.get('type') as string || 'percentage';
  const rawValue = parseFloat(formData.get('value') as string);
  const value = type === 'fixed' ? Math.round(rawValue * 100) : Math.round(rawValue);
  const maxUses = formData.get('max_uses') ? parseInt(formData.get('max_uses') as string) : null;
  const description = (formData.get('description') as string) || null;

  if (!code || isNaN(rawValue)) return { message: 'Code and value are required.' };
  try {
    await sql`
      INSERT INTO discount_codes (code, description, type, value, max_uses)
      VALUES (${code}, ${description}, ${type}, ${value}, ${maxUses})
    `;
  } catch (e: any) {
    if (e.message?.includes('unique')) return { message: 'That code already exists.' };
    return { message: 'Failed to create discount code.' };
  }
  revalidatePath('/dashboard/discounts');
  redirect('/dashboard/discounts');
}

export async function toggleDiscountCode(id: string, active: boolean) {
  try {
    await sql`UPDATE discount_codes SET is_active = ${active} WHERE id = ${id}`;
    revalidatePath('/dashboard/discounts');
    return { success: true };
  } catch { return { message: 'Failed to toggle discount code.' }; }
}

// ─────────────────────────────────────────
// PURCHASE ORDERS
// ─────────────────────────────────────────

export async function createPurchaseOrder(formData: FormData) {
  const supplier_id = formData.get('supplier_id') as string;
  if (!supplier_id) return { message: 'Supplier is required.' };
  const expected_at = (formData.get('expected_at') as string) || null;
  const notes = (formData.get('notes') as string) || null;
  try {
    await sql`INSERT INTO purchase_orders (supplier_id, expected_at, notes) VALUES (${supplier_id}, ${expected_at}, ${notes})`;
  } catch { return { message: 'Failed to create purchase order.' }; }
  revalidatePath('/dashboard/orders');
  redirect('/dashboard/orders');
}

export async function receivePurchaseOrder(id: string, formData?: FormData) {
  // Allow marking as 'ordered' via hidden input or to 'received'
  const setStatus = (formData?.get('set_status') as string) || 'received';
  try {
    if (setStatus === 'received') {
      await sql`UPDATE purchase_orders SET status = 'received', received_at = NOW() WHERE id = ${id}`;
    } else {
      await sql`UPDATE purchase_orders SET status = ${setStatus} WHERE id = ${id}`;
    }
    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch { return { message: 'Failed to update purchase order.' }; }
}
