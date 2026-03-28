import { fetchProductById, fetchCategories } from '@/app/lib/data';
import { updateProduct } from '@/app/lib/actions';
import { playfair } from '@/app/ui/fonts';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories] = await Promise.all([
    fetchProductById(params.id),
    fetchCategories(),
  ]);

  if (!product) notFound();

  const updateProductWithId = updateProduct.bind(null, product.id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/products" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={`${playfair.className} text-2xl font-bold text-slate-900`}>Edit Product</h1>
          <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku || '—'}</p>
        </div>
      </div>

      <form action={updateProductWithId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Name *</label>
            <input name="name" required defaultValue={product.name}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea name="description" rows={2} defaultValue={product.description || ''}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Price (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input name="price" type="number" step="0.01" min="0.01" required
                defaultValue={(product.price / 100).toFixed(2)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SKU</label>
            <input name="sku" defaultValue={product.sku || ''}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
            <select name="category_id" defaultValue={product.category_id || ''}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
              <option value="">— No category —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Stock</label>
            <input name="stock" type="number" min="0" defaultValue={product.stock}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Low Stock Alert At</label>
            <input name="low_stock_threshold" type="number" min="0" defaultValue={product.low_stock_threshold}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        {/* Stock & price summary */}
        <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-400">Current Price</p>
            <p className="text-sm font-bold text-indigo-600 mt-0.5">${(product.price / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">In Stock</p>
            <p className={`text-sm font-bold mt-0.5 ${product.stock === 0 ? 'text-red-500' : product.stock <= product.low_stock_threshold ? 'text-amber-500' : 'text-emerald-600'}`}>
              {product.stock}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Alert When</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">≤ {product.low_stock_threshold}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/products"
            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 text-center hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit"
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
