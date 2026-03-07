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
// LEGACY INVOICE ACTIONS
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
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        return { message: 'Database Error: Failed to Create Invoice.' };
    }
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
        await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
    } catch (error) {
        return { message: 'Database Error: Failed to Update Invoice.' };
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Invoice.' };
    }
}

// ─────────────────────────────────────────
// POS — PRODUCTS
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

    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors, message: 'Validation failed.' };
    }

    const { name, description, price, category_id, sku, stock, low_stock_threshold, image_url } = parsed.data;
    const priceInCents = Math.round(price * 100);

    try {
        await sql`
      INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold, image_url)
      VALUES (
        ${name}, ${description || null}, ${priceInCents},
        ${category_id || null}, ${sku || null}, ${stock},
        ${low_stock_threshold}, ${image_url || null}
      )
    `;
    } catch (error) {
        return { message: 'Database Error: Failed to create product.' };
    }

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

    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors, message: 'Validation failed.' };
    }

    const { name, description, price, category_id, sku, stock, low_stock_threshold, image_url } = parsed.data;
    const priceInCents = Math.round(price * 100);

    try {
        await sql`
      UPDATE products SET
        name = ${name},
        description = ${description || null},
        price = ${priceInCents},
        category_id = ${category_id || null},
        sku = ${sku || null},
        stock = ${stock},
        low_stock_threshold = ${low_stock_threshold},
        image_url = ${image_url || null}
      WHERE id = ${id}
    `;
    } catch (error) {
        return { message: 'Database Error: Failed to update product.' };
    }

    revalidatePath('/dashboard/products');
    redirect('/dashboard/products');
}

export async function deleteProduct(id: string) {
    try {
        await sql`UPDATE products SET is_active = false WHERE id = ${id}`;
        revalidatePath('/dashboard/products');
        return { message: 'Product deactivated.' };
    } catch (error) {
        return { message: 'Database Error: Failed to delete product.' };
    }
}

export async function adjustStock(productId: string, delta: number) {
    try {
        await sql`
      UPDATE products SET stock = GREATEST(0, stock + ${delta}) WHERE id = ${productId}
    `;
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/products');
        return { success: true };
    } catch (error) {
        return { message: 'Database Error: Failed to adjust stock.' };
    }
}

// ─────────────────────────────────────────
// POS — SALES / CHECKOUT
// ─────────────────────────────────────────

const CheckoutSchema = z.object({
    customer_id: z.string().optional(),
    items: z.array(z.object({
        product_id: z.string(),
        name: z.string(),
        sku: z.string().nullable(),
        price: z.number(),
        quantity: z.number().int().min(1),
        total: z.number(),
    })).min(1, 'Cart is empty.'),
    discount_amount: z.coerce.number().min(0).default(0),
    tax_rate: z.coerce.number().min(0).max(100).default(0),
    payment_method: z.enum(['cash', 'card', 'transfer']),
    cash_tendered: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
});

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
      VALUES (
        ${data.customer_id || null},
        ${subtotal},
        ${discountCents},
        ${taxCents},
        ${total},
        ${data.payment_method},
        ${cashTenderedCents},
        ${changeGiven},
        ${data.notes || null},
        'Admin'
      )
      RETURNING id
    `;

        const saleId = saleRes.rows[0].id;

        // Insert line items & decrement stock in parallel
        await Promise.all(
            data.items.map((item) =>
                Promise.all([
                    sql`
            INSERT INTO sale_items (sale_id, product_id, product_name, sku, quantity, unit_price, total)
            VALUES (${saleId}, ${item.product_id}, ${item.name}, ${item.sku || null}, ${item.quantity}, ${item.price}, ${item.total})
          `,
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
        await sql`UPDATE sales SET status = 'voided' WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { success: true };
    } catch (error) {
        return { message: 'Database Error: Failed to void sale.' };
    }
}
