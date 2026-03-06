import { fetchAllActiveProducts, fetchCategories } from '@/app/lib/data';
import POSTerminal from '@/app/ui/pos/terminal';
import { playfair } from '@/app/ui/fonts';

export default async function POSPage() {
    const [products, categories] = await Promise.all([
        fetchAllActiveProducts(),
        fetchCategories(),
    ]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h1 className={`${playfair.className} text-2xl md:text-3xl font-bold text-slate-900`}>
                        POS Terminal
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">{products.length} products available</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Terminal Active
                </div>
            </div>
            <POSTerminal initialProducts={products} categories={categories} />
        </div>
    );
}
