import Search from '@/app/ui/search';
import { playfair } from '@/app/ui/fonts';
import { PlusIcon, PencilIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchProducts, fetchProductsPages, fetchCategories } from '@/app/lib/data';
import { getTranslations } from '@/app/lib/i18n/server';
import { deleteProduct } from '@/app/lib/actions';
import Pagination from '@/app/ui/invoices/pagination';
import { formatCurrency } from '@/app/lib/utils';
import clsx from 'clsx';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: { query?: string; page?: string; category?: string };
}) {
    const query = searchParams?.query || '';
    const currentPage = Number(searchParams?.page) || 1;
    const categoryId = searchParams?.category;

    const [products, totalPages, categories, t] = await Promise.all([
        fetchProducts(query, currentPage, categoryId),
        fetchProductsPages(query, categoryId),
        fetchCategories(),
        getTranslations(),
    ]);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between mb-6">
                <h1 className={`${playfair.className} text-2xl md:text-4xl font-bold text-slate-900`}>{t.products.title}</h1>
                <Link
                    href="/dashboard/products/create"
                    className="flex items-center gap-2 h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.products.addProduct}</span>
                </Link>
            </div>

            {/* Category filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                <Link href={`/dashboard/products?query=${query}`}
                    className={clsx('shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', !categoryId ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400')}>
                    {t.pos.allCategories}
                </Link>
                {categories.map((cat) => (
                    <Link key={cat.id} href={`/dashboard/products?query=${query}&category=${cat.id}`}
                        style={categoryId === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                        className={clsx('shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', categoryId === cat.id ? 'text-white' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400')}>
                        {cat.name}
                    </Link>
                ))}
            </div>

            <div className="mb-4">
                <Search placeholder={t.products.search} />
            </div>

            {/* Product grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {products.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-400">
                        <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-3" />
                        <p>{t.products.noProducts}</p>
                    </div>
                )}
                {products.map((product) => {
                    const isLow = product.stock > 0 && product.stock <= product.low_stock_threshold;
                    const isOut = product.stock === 0;
                    const deleteAction = deleteProduct.bind(null, product.id);
                    return (
                        <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="h-28 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-5xl relative">
                                {product.category_name === 'Food & Beverage' ? '🥤' :
                                    product.category_name === 'Electronics' ? '📱' :
                                        product.category_name === 'Clothing' ? '👕' :
                                            product.category_name === 'Home & Office' ? '🏠' :
                                                product.category_name === 'Health & Beauty' ? '✨' :
                                                    product.category_name === 'Sports' ? '⚽' :
                                                        product.category_name === 'Books & Media' ? '📚' : '📦'}
                                {product.category_color && (
                                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: product.category_color }}>
                                        {product.category_name}
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-slate-800 leading-tight">{product.name}</p>
                                        {product.sku && <p className="text-xs text-slate-400 mt-0.5">{t.products.sku}: {product.sku}</p>}
                                    </div>
                                    <p className="text-indigo-600 font-bold text-sm shrink-0">{formatCurrency(product.price)}</p>
                                </div>
                                <div className={clsx('mt-3 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                                    isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'
                                )}>
                                    <span className={clsx('w-1.5 h-1.5 rounded-full', isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-400')} />
                                    {isOut ? t.products.stockStatus.out : isLow ? `${t.products.stockStatus.low}: ${product.stock}` : `${product.stock} ${t.products.inStock}`}
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Link href={`/dashboard/products/${product.id}/edit`}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                        <PencilIcon className="w-3.5 h-3.5" /> {t.common.edit}
                                    </Link>
                                    <form action={deleteAction}>
                                        <button type="submit" className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                                            {t.products.archive}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}
