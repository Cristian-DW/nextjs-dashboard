'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem, Category } from '@/app/lib/definitions';
import { createSale } from '@/app/lib/actions';
import { MagnifyingGlassIcon, ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon, XMarkIcon, BanknotesIcon, CreditCardIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/lib/utils';
import clsx from 'clsx';

type PaymentMethod = 'cash' | 'card' | 'transfer';

interface TerminalProps {
    initialProducts: Product[];
    categories: Category[];
}

type ReceiptData = {
    saleId: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    change: number;
    paymentMethod: PaymentMethod;
};

export default function POSTerminal({ initialProducts, categories }: TerminalProps) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discountPct, setDiscountPct] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cashTendered, setCashTendered] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const filteredProducts = initialProducts.filter((p) => {
        const matchesSearch = search === '' ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = !activeCategory || p.category_id === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement !== searchRef.current) {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setShowCheckout(false);
                setReceipt(null);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && cart.length > 0) {
                e.preventDefault();
                setShowCheckout(true);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [cart]);

    const addToCart = useCallback((product: Product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
                        : i
                );
            }
            return [...prev, {
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                quantity: 1,
                total: product.price,
            }];
        });
    }, []);

    const updateQty = (product_id: string, delta: number) => {
        setCart((prev) =>
            prev.map((i) => {
                if (i.product_id !== product_id) return i;
                const newQty = i.quantity + delta;
                if (newQty <= 0) return null as any;
                return { ...i, quantity: newQty, total: newQty * i.price };
            }).filter(Boolean)
        );
    };

    const removeItem = (product_id: string) => setCart((p) => p.filter((i) => i.product_id !== product_id));
    const clearCart = () => { setCart([]); setDiscountPct(0); setCashTendered(''); };

    const subtotal = cart.reduce((s, i) => s + i.total, 0);
    const discountAmt = Math.round(subtotal * (discountPct / 100));
    const taxAmt = Math.round((subtotal - discountAmt) * (taxRate / 100));
    const total = subtotal - discountAmt + taxAmt;
    const cashTenderedCents = Math.round(Number(cashTendered) * 100);
    const change = Math.max(0, cashTenderedCents - total);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        const result = await createSale({
            items: cart,
            discount_amount: discountAmt / 100,
            tax_rate: taxRate,
            payment_method: paymentMethod,
            cash_tendered: Number(cashTendered) || 0,
            notes: '',
        });
        setLoading(false);
        if (result.success) {
            setReceipt({
                saleId: result.saleId!,
                items: [...cart],
                subtotal, discount: discountAmt, tax: taxAmt, total,
                change: result.changeGiven || 0,
                paymentMethod,
            });
            clearCart();
            setShowCheckout(false);
        }
    };

    if (receipt) {
        return <Receipt data={receipt} onClose={() => setReceipt(null)} />;
    }

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-4">
            {/* ── LEFT: Product Grid ─────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search */}
                <div className="relative mb-3">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        ref={searchRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products… (press / to focus)"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={clsx('shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', {
                            'bg-indigo-600 text-white border-indigo-600': !activeCategory,
                            'bg-white text-slate-600 border-slate-200 hover:border-indigo-400': activeCategory,
                        })}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                            style={{ borderColor: activeCategory === cat.id ? cat.color : undefined, backgroundColor: activeCategory === cat.id ? cat.color : undefined }}
                            className={clsx('shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', {
                                'text-white': activeCategory === cat.id,
                                'bg-white text-slate-600 border-slate-200 hover:border-slate-400': activeCategory !== cat.id,
                            })}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-2 pr-1">
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                            <ExclamationTriangleIcon className="w-10 h-10 mb-2" />
                            <p className="text-sm">No products found</p>
                        </div>
                    )}
                    {filteredProducts.map((product) => {
                        const outOfStock = product.stock === 0;
                        return (
                            <button
                                key={product.id}
                                onClick={() => !outOfStock && addToCart(product)}
                                disabled={outOfStock}
                                className={clsx(
                                    'relative text-left p-3 rounded-xl border bg-white shadow-sm transition-all group',
                                    outOfStock
                                        ? 'opacity-50 cursor-not-allowed border-slate-100'
                                        : 'hover:shadow-md hover:border-indigo-300 active:scale-95 cursor-pointer border-slate-100',
                                )}
                            >
                                {/* Category dot */}
                                {product.category_color && (
                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: product.category_color }} />
                                )}
                                <div className="h-16 w-full mb-2 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden">
                                    <span className="text-3xl">
                                        {product.category_name === 'Food & Beverage' ? '🥤' :
                                            product.category_name === 'Electronics' ? '📱' :
                                                product.category_name === 'Clothing' ? '👕' :
                                                    product.category_name === 'Home & Office' ? '🏠' :
                                                        product.category_name === 'Health & Beauty' ? '✨' :
                                                            product.category_name === 'Sports' ? '⚽' :
                                                                product.category_name === 'Books & Media' ? '📚' : '📦'}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mb-1">{product.name}</p>
                                <p className="text-sm font-bold text-indigo-600">{formatCurrency(product.price)}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={clsx('text-xs', product.stock <= product.low_stock_threshold ? 'text-amber-500 font-medium' : 'text-slate-400')}>
                                        {outOfStock ? 'Out of stock' : `${product.stock} left`}
                                    </span>
                                    {!outOfStock && (
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                                            <PlusIcon className="w-4 h-4" />
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── RIGHT: Cart ─────────────────────────── */}
            <div className="w-80 xl:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Cart header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <ShoppingCartIcon className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold text-slate-800 text-sm">Cart</span>
                        {cart.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                            <TrashIcon className="w-3.5 h-3.5" /> Clear
                        </button>
                    )}
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full py-16 text-slate-300">
                            <ShoppingCartIcon className="w-12 h-12 mb-3" />
                            <p className="text-sm text-slate-400">Cart is empty</p>
                            <p className="text-xs text-slate-300 mt-1">Click a product to add it</p>
                        </div>
                    )}
                    {cart.map((item) => (
                        <div key={item.product_id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 group">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                                <p className="text-xs text-slate-500">{formatCurrency(item.price)} each</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700">
                                    <MinusIcon className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-bold text-slate-800 w-5 text-center">{item.quantity}</span>
                                <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700">
                                    <PlusIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="text-right min-w-[52px]">
                                <p className="text-xs font-bold text-slate-800">{formatCurrency(item.total)}</p>
                                <button onClick={() => removeItem(item.product_id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Discounts & Tax */}
                {cart.length > 0 && (
                    <div className="px-4 pt-2 pb-1 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 w-24 shrink-0">Discount %</label>
                            <input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))}
                                className="flex-1 text-right text-sm font-semibold rounded-lg border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 w-24 shrink-0">Tax %</label>
                            <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}
                                className="flex-1 text-right text-sm font-semibold rounded-lg border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                        </div>
                    </div>
                )}

                {/* Totals */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span></div>
                    {discountAmt > 0 && <div className="flex justify-between text-emerald-600"><span>Discount ({discountPct}%)</span><span>-{formatCurrency(discountAmt)}</span></div>}
                    {taxAmt > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmt)}</span></div>}
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                        <span>Total</span><span>{formatCurrency(total)}</span>
                    </div>
                </div>

                {/* Checkout button */}
                <div className="p-3">
                    <button
                        disabled={cart.length === 0}
                        onClick={() => setShowCheckout(true)}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        Checkout — {formatCurrency(total)}
                    </button>
                    <p className="text-center text-xs text-slate-300 mt-1.5">⌘ + Enter to checkout • / to search</p>
                </div>
            </div>

            {/* ── CHECKOUT MODAL ── */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Complete Sale</h2>
                            <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-5">
                            {/* Order summary */}
                            <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
                                {cart.map((i) => (
                                    <div key={i.product_id} className="flex justify-between text-slate-600">
                                        <span>{i.quantity}× {i.name}</span>
                                        <span>{formatCurrency(i.total)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-bold text-slate-900">
                                    <span>Total</span><span>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Payment method */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Method</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {([['cash', '💵', 'Cash'], ['card', '💳', 'Card'], ['transfer', '🏦', 'Transfer']] as const).map(([method, emoji, label]) => (
                                        <button key={method} onClick={() => setPaymentMethod(method)}
                                            className={clsx('py-3 rounded-xl border-2 text-sm font-semibold flex flex-col items-center gap-1 transition-all', {
                                                'border-indigo-500 bg-indigo-50 text-indigo-700': paymentMethod === method,
                                                'border-slate-200 text-slate-500 hover:border-slate-300': paymentMethod !== method,
                                            })}
                                        >
                                            <span className="text-xl">{emoji}</span> {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cash tendered */}
                            {paymentMethod === 'cash' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Tendered</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                                        <input type="number" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)}
                                            placeholder="0.00" min={total / 100}
                                            className="w-full pl-7 pr-4 py-3 rounded-xl border-2 border-slate-200 text-lg font-bold focus:outline-none focus:border-indigo-400"
                                        />
                                    </div>
                                    {cashTenderedCents > 0 && (
                                        <div className={clsx('mt-2 text-center rounded-lg py-2 font-bold text-sm', change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                                            Change: {formatCurrency(change)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="px-6 pb-5">
                            <button onClick={handleCheckout} disabled={loading || (paymentMethod === 'cash' && cashTenderedCents > 0 && cashTenderedCents < total)}
                                className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                                {loading ? 'Processing...' : 'Confirm Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
    const now = new Date();
    return (
        <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-emerald-500 px-6 py-8 text-white text-center">
                    <CheckCircleIcon className="w-14 h-14 mx-auto mb-3 opacity-90" />
                    <h2 className="text-2xl font-bold">Sale Complete!</h2>
                    <p className="text-emerald-100 text-sm mt-1">#{data.saleId.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="px-6 py-5">
                    <div className="text-xs text-slate-400 text-center mb-4">{now.toLocaleString()}</div>
                    <div className="space-y-1.5 mb-4">
                        {data.items.map((i) => (
                            <div key={i.product_id} className="flex justify-between text-sm text-slate-600">
                                <span>{i.quantity}× {i.name}</span>
                                <span>{formatCurrency(i.total)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-sm">
                        <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
                        {data.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(data.discount)}</span></div>}
                        {data.tax > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>{formatCurrency(data.tax)}</span></div>}
                        <div className="flex justify-between font-bold text-lg text-slate-900 pt-1"><span>Total</span><span>{formatCurrency(data.total)}</span></div>
                        {data.paymentMethod === 'cash' && data.change > 0 && (
                            <div className="flex justify-between text-indigo-600 font-semibold"><span>Change</span><span>{formatCurrency(data.change)}</span></div>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                            {data.paymentMethod === 'cash' ? <BanknotesIcon className="w-3.5 h-3.5" /> : <CreditCardIcon className="w-3.5 h-3.5" />}
                            Paid by {data.paymentMethod}
                        </span>
                    </div>
                </div>
                <div className="px-6 pb-5">
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all">
                        New Sale
                    </button>
                </div>
            </div>
        </div>
    );
}
