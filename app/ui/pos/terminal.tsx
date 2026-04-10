'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CartItem, Category } from '@/app/lib/definitions';
import { createSale, validateDiscountCode } from '@/app/lib/actions';
import {
  MagnifyingGlassIcon, ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon,
  XMarkIcon, BanknotesIcon, CreditCardIcon, ArrowPathIcon, CheckCircleIcon,
  ExclamationTriangleIcon, TagIcon, UserIcon, PauseIcon, PrinterIcon,
  PencilSquareIcon, CalculatorIcon, ArrowRightIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/lib/utils';
import clsx from 'clsx';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'split';

interface TerminalProps {
  initialProducts: Product[];
  categories: Category[];
  defaultTaxRate?: number;
}

type HeldSale = { id: string; items: CartItem[]; label: string; savedAt: Date };

type ReceiptData = {
  saleId: string; items: CartItem[]; subtotal: number; discount: number;
  tax: number; total: number; change: number; paymentMethod: string;
  couponCode?: string; customerName?: string;
};

type SplitPayment = { cash: string; card: string };

// ─── NUMPAD ──────────────────────────────────────────────────────────────────
function NumPad({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const press = (k: string) => {
    if (k === 'DEL') { onChange(value.slice(0, -1)); return; }
    if (k === 'CLR') { onChange(''); return; }
    if (k === '.' && value.includes('.')) return;
    onChange(value + k);
  };
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'DEL'];
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-64">
      <div className="bg-slate-50 rounded-xl px-4 py-3 text-right text-2xl font-bold text-slate-900 mb-3 min-h-[52px]">
        {value || '0'}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)}
            className={clsx('h-12 rounded-xl font-bold text-sm transition-all active:scale-95', {
              'bg-red-50 text-red-500 hover:bg-red-100': k === 'DEL',
              'bg-slate-100 text-slate-700 hover:bg-slate-200': k !== 'DEL',
            })}>
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button onClick={() => press('CLR')} className="h-10 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-100 transition-all">Clear</button>
        <button onClick={onClose} className="h-10 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all">Done</button>
      </div>
    </div>
  );
}

// ─── CUSTOM ITEM MODAL ────────────────────────────────────────────────────────
function CustomItemModal({ onAdd, onClose }: { onAdd: (item: CartItem) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const handleAdd = () => {
    if (!name || !price) return;
    const priceCents = Math.round(Number(price) * 100);
    const quantity = Math.max(1, parseInt(qty) || 1);
    onAdd({ product_id: `custom_${Date.now()}`, name, sku: null, price: priceCents, quantity, total: priceCents * quantity });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900">Custom Item</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Service fee"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price ($) *</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</label>
              <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="1"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleAdd} disabled={!name || !price}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN TERMINAL ────────────────────────────────────────────────────────────
export default function POSTerminal({ initialProducts, categories, defaultTaxRate = 0 }: TerminalProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; label: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [taxRate, setTaxRate] = useState(defaultTaxRate);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [splitPayment, setSplitPayment] = useState<SplitPayment>({ cash: '', card: '' });
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [showNumPad, setShowNumPad] = useState<{ field: 'cash' | 'cashInSplit' | 'cardInSplit' } | null>(null);
  const [numPadTarget, setNumPadTarget] = useState('');
  const [customerName, setCustomerName] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = initialProducts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = q === '' || p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q));
    const matchesCategory = !activeCategory || p.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current && !showCheckout) {
        e.preventDefault(); searchRef.current?.focus();
      }
      if (e.key === 'Escape') { setShowCheckout(false); setReceipt(null); setShowHeld(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && cart.length > 0) { e.preventDefault(); setShowCheckout(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') { e.preventDefault(); holdSale(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart, showCheckout]);

  // ── Cart
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) return prev.map((i) => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i);
      return [...prev, { product_id: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1, total: product.price }];
    });
  }, []);

  const addCustomItem = (item: CartItem) => setCart((p) => [...p, item]);

  const updateQty = (product_id: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.product_id !== product_id) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null as any;
      return { ...i, quantity: newQty, total: newQty * i.price };
    }).filter(Boolean));
  };

  const setItemQty = (product_id: string, qty: number) => {
    if (qty <= 0) { removeItem(product_id); return; }
    setCart((prev) => prev.map((i) => i.product_id === product_id ? { ...i, quantity: qty, total: qty * i.price } : i));
  };

  const removeItem = (id: string) => setCart((p) => p.filter((i) => i.product_id !== id));
  const clearCart = () => { setCart([]); setAppliedDiscount(null); setDiscountCode(''); setCashTendered(''); setSplitPayment({ cash: '', card: '' }); setCustomerName(''); };

  // ── Hold / Retrieve
  const holdSale = () => {
    if (cart.length === 0) return;
    const label = `${customerName || 'Cart'} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setHeldSales((prev) => [...prev, { id: `hold_${Date.now()}`, items: [...cart], label, savedAt: new Date() }]);
    clearCart();
  };

  const retrieveHeld = (held: HeldSale) => {
    setCart(held.items);
    setHeldSales((prev) => prev.filter((h) => h.id !== held.id));
    setShowHeld(false);
  };

  // ── Coupon
  const applyCoupon = async () => {
    if (!discountCode.trim()) return;
    setCouponLoading(true); setCouponError('');
    const result = await validateDiscountCode(discountCode.trim(), subtotal);
    setCouponLoading(false);
    if (result.valid) {
      const label = result.type === 'percentage' ? `${result.value}% off` : formatCurrency(result.value);
      setAppliedDiscount({ code: discountCode.toUpperCase(), amount: result.discount!, label });
      setDiscountCode('');
    } else {
      setCouponError(result.message || 'Invalid code');
    }
  };

  // ── Totals
  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const discountAmt = appliedDiscount?.amount ?? 0;
  const taxAmt = Math.round((subtotal - discountAmt) * (taxRate / 100));
  const total = Math.max(0, subtotal - discountAmt + taxAmt);
  const cashTenderedCents = Math.round(Number(cashTendered) * 100);
  const change = Math.max(0, cashTenderedCents - total);
  const splitCashCents = Math.round(Number(splitPayment.cash) * 100);
  const splitCardCents = Math.round(Number(splitPayment.card) * 100);
  const splitValid = splitCashCents + splitCardCents >= total;

  // ── Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const result = await createSale({
      items: cart,
      discount_amount: discountAmt / 100,
      tax_rate: taxRate,
      payment_method: paymentMethod === 'split' ? 'cash' : paymentMethod,
      cash_tendered: paymentMethod === 'split' ? splitCashCents / 100 : Number(cashTendered) || 0,
      notes: customerName ? `Customer: ${customerName}` : '',
    });
    setLoading(false);
    if (result.success) {
      setReceipt({
        saleId: result.saleId!, items: [...cart], subtotal, discount: discountAmt,
        tax: taxAmt, total, change: result.changeGiven || 0,
        paymentMethod: paymentMethod === 'split' ? `Split (Cash+Card)` : paymentMethod,
        couponCode: appliedDiscount?.code, customerName: customerName || undefined,
      });
      clearCart(); setShowCheckout(false);
    }
  };

  // ── NumPad done
  const onNumPadDone = () => {
    if (!showNumPad) return;
    if (showNumPad.field === 'cash') setCashTendered(numPadTarget);
    if (showNumPad.field === 'cashInSplit') setSplitPayment((p) => ({ ...p, cash: numPadTarget }));
    if (showNumPad.field === 'cardInSplit') setSplitPayment((p) => ({ ...p, card: numPadTarget }));
    setShowNumPad(null); setNumPadTarget('');
  };

  const openNumPad = (field: 'cash' | 'cashInSplit' | 'cardInSplit', current: string) => {
    setNumPadTarget(current); setShowNumPad({ field });
  };

  if (receipt) return <Receipt data={receipt} onClose={() => setReceipt(null)} />;

  const CATEGORY_EMOJI: Record<string, string> = {
    'Food & Beverage': '🥤', 'Electronics': '📱', 'Clothing': '👕',
    'Home & Office': '🏠', 'Health & Beauty': '✨', 'Sports': '⚽',
    'Books & Media': '📚',
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-3 relative">
      {/* ━━ LEFT: Product Grid ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Search + Actions bar */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products… (press /)"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => setShowCustomItem(true)} title="Add custom item"
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm">
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <div className="relative">
            <button onClick={() => setShowHeld(!showHeld)} title="Held sales (⌘H)"
              className={clsx('px-3 py-2.5 rounded-xl border bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm relative', heldSales.length > 0 ? 'border-amber-300 text-amber-600' : 'border-slate-200')}>
              <PauseIcon className="w-4 h-4" />
              {heldSales.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{heldSales.length}</span>
              )}
            </button>
            {showHeld && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Held Sales</span>
                  <button onClick={() => setShowHeld(false)}><XMarkIcon className="w-4 h-4 text-slate-400" /></button>
                </div>
                {heldSales.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">No held sales</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {heldSales.map((h) => (
                      <button key={h.id} onClick={() => retrieveHeld(h)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors">
                        <p className="text-sm font-semibold text-slate-800 truncate">{h.label}</p>
                        <p className="text-xs text-slate-400">{h.items.length} items · {formatCurrency(h.items.reduce((s, i) => s + i.total, 0))}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none shrink-0">
          <button onClick={() => setActiveCategory(null)}
            className={clsx('shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', !activeCategory ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400')}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={activeCategory === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              className={clsx('shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', activeCategory === cat.id ? 'text-white shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400')}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-2 pr-1 content-start">
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <ExclamationTriangleIcon className="w-10 h-10 mb-2" />
              <p className="text-sm">No products found</p>
              <button onClick={() => setShowCustomItem(true)} className="mt-2 text-xs text-indigo-500 hover:underline">+ Add custom item</button>
            </div>
          )}
          {filteredProducts.map((product) => {
            const outOfStock = product.stock === 0;
            const inCart = cart.find((i) => i.product_id === product.id);
            return (
              <button key={product.id} onClick={() => !outOfStock && addToCart(product)} disabled={outOfStock}
                className={clsx('relative text-left p-3 rounded-xl border bg-white shadow-sm transition-all group',
                  outOfStock ? 'opacity-40 cursor-not-allowed border-slate-100' : 'hover:shadow-md hover:border-indigo-300 active:scale-[0.97] cursor-pointer border-slate-100',
                  inCart && 'border-indigo-200 bg-indigo-50/30'
                )}>
                {inCart && (
                  <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
                    ×{inCart.quantity}
                  </span>
                )}
                {product.category_color && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: product.category_color }} />
                )}
                <div className="h-14 w-full mb-2 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-3xl">
                  {CATEGORY_EMOJI[product.category_name || ''] || '📦'}
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mb-1">{product.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-indigo-600">{formatCurrency(product.price)}</p>
                  <span className={clsx('text-[10px]', product.stock <= product.low_stock_threshold && product.stock > 0 ? 'text-amber-500 font-medium' : 'text-slate-300')}>
                    {outOfStock ? '⚠ Out' : product.stock <= product.low_stock_threshold ? `${product.stock} left` : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ━━ RIGHT: Cart Panel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-80 xl:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0">

        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm">Cart</span>
            {cart.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button onClick={holdSale} title="Hold sale (⌘H)"
                className="text-amber-400 hover:text-amber-600 transition-colors" >
                <PauseIcon className="w-4 h-4" />
              </button>
            )}
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Customer name */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-50 shrink-0">
          <UserIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name (optional)"
            className="flex-1 text-xs text-slate-600 placeholder-slate-300 bg-transparent focus:outline-none" />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300">
              <ShoppingCartIcon className="w-10 h-10 mb-2" />
              <p className="text-sm text-slate-400">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.product_id} className="flex items-center gap-2 px-2 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{item.name}</p>
                <p className="text-xs text-slate-400">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(item.product_id, -1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
                  <MinusIcon className="w-3 h-3" />
                </button>
                <input
                  type="number" value={item.quantity} min={1}
                  onChange={(e) => setItemQty(item.product_id, parseInt(e.target.value) || 1)}
                  className="w-8 h-6 text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-none focus:bg-white focus:rounded border-0"
                />
                <button onClick={() => updateQty(item.product_id, 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors">
                  <PlusIcon className="w-3 h-3" />
                </button>
              </div>
              <div className="text-right min-w-[50px]">
                <p className="text-xs font-bold text-slate-800">{formatCurrency(item.total)}</p>
                <button onClick={() => removeItem(item.product_id)}
                  className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon + Tax */}
        {cart.length > 0 && (
          <div className="px-4 pt-2 pb-1 border-t border-slate-50 space-y-1.5 shrink-0">
            {/* Coupon */}
            {appliedDiscount ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">{appliedDiscount.code}</span>
                  <span className="text-xs text-emerald-600">— {appliedDiscount.label}</span>
                </div>
                <button onClick={() => setAppliedDiscount(null)} className="text-emerald-400 hover:text-emerald-600">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      placeholder="Coupon code"
                      className="w-full pl-8 pr-2 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 tracking-wider" />
                  </div>
                  <button onClick={applyCoupon} disabled={couponLoading || !discountCode}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 shrink-0 transition-colors">
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-0.5">{couponError}</p>}
              </div>
            )}
            {/* Tax */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 w-20 shrink-0">Tax %</label>
              <input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}
                className="flex-1 text-right text-sm font-semibold rounded-lg border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="px-4 py-3 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100 space-y-1 text-xs text-slate-500 shrink-0">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-slate-600">{formatCurrency(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {appliedDiscount?.code ? `(${appliedDiscount.code})` : ''}</span>
              <span>-{formatCurrency(discountAmt)}</span>
            </div>
          )}
          {taxAmt > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmt)}</span></div>}
          <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Total</span><span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Checkout CTA */}
        <div className="p-3 shrink-0">
          <button disabled={cart.length === 0} onClick={() => setShowCheckout(true)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2">
            <span>Charge {formatCurrency(total)}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
          <p className="text-center text-[10px] text-slate-300 mt-1.5">⌘↩ checkout · / search · ⌘H hold</p>
        </div>
      </div>

      {/* ━━ CHECKOUT MODAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowCheckout(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Complete Sale</h2>
                {customerName && <p className="text-xs text-slate-400">{customerName}</p>}
              </div>
              <button onClick={() => setShowCheckout(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Order summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm max-h-36 overflow-y-auto">
                {cart.map((i) => (
                  <div key={i.product_id} className="flex justify-between text-slate-600">
                    <span className="truncate mr-2">{i.quantity}× {i.name}</span>
                    <span className="shrink-0">{formatCurrency(i.total)}</span>
                  </div>
                ))}
                {discountAmt > 0 && (
                  <div className="flex justify-between text-emerald-600 pt-1 border-t border-slate-200">
                    <span>Discount</span><span>-{formatCurrency(discountAmt)}</span>
                  </div>
                )}
                {taxAmt > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-slate-900 text-base pt-1.5 border-t-2 border-slate-200">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Method</p>
                <div className="grid grid-cols-4 gap-2">
                  {([['cash', '💵', 'Cash'], ['card', '💳', 'Card'], ['transfer', '🏦', 'Transfer'], ['split', '⚡', 'Split']] as const).map(([method, emoji, label]) => (
                    <button key={method} onClick={() => setPaymentMethod(method)}
                      className={clsx('py-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all', {
                        'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100': paymentMethod === method,
                        'border-slate-200 text-slate-500 hover:border-slate-300': paymentMethod !== method,
                      })}>
                      <span className="text-xl">{emoji}</span>{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash tendered */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Tendered</label>
                  <div className="relative mt-1 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                      <input type="number" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)}
                        placeholder="0.00" autoFocus
                        className="w-full pl-7 pr-4 py-3 rounded-xl border-2 border-slate-200 text-xl font-bold focus:outline-none focus:border-indigo-400" />
                    </div>
                    <button onClick={() => openNumPad('cash', cashTendered)} className="px-3 rounded-xl border-2 border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                      <CalculatorIcon className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Quick cash buttons */}
                  <div className="flex gap-2 mt-2">
                    {[Math.ceil(total / 100), Math.ceil(total / 500) * 5, Math.ceil(total / 1000) * 10, Math.ceil(total / 2000) * 20].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).map((amt) => (
                      <button key={amt} onClick={() => setCashTendered(amt.toString())}
                        className="flex-1 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
                        ${amt}
                      </button>
                    ))}
                  </div>
                  {cashTenderedCents > 0 && (
                    <div className={clsx('mt-2 text-center rounded-xl py-2.5 font-bold text-sm', change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                      Change: {formatCurrency(change)}
                    </div>
                  )}
                </div>
              )}

              {/* Split payment */}
              {paymentMethod === 'split' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Split total of <strong>{formatCurrency(total)}</strong> between cash and card.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['cash', 'card'] as const).map((type) => (
                      <div key={type}>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider capitalize">{type == 'cash' ? '💵 Cash' : '💳 Card'}</label>
                        <div className="relative mt-1 flex gap-1">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input type="number" value={splitPayment[type === 'cash' ? 'cash' : 'card']}
                              onChange={(e) => setSplitPayment((p) => ({ ...p, [type === 'cash' ? 'cash' : 'card']: e.target.value }))}
                              placeholder="0.00"
                              className="w-full pl-7 pr-2 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:outline-none focus:border-indigo-400" />
                          </div>
                          <button onClick={() => openNumPad(type === 'cash' ? 'cashInSplit' : 'cardInSplit', splitPayment[type === 'cash' ? 'cash' : 'card'])}
                            className="px-2 rounded-xl border-2 border-slate-200 text-slate-400 hover:border-indigo-400">
                            <CalculatorIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={clsx('text-center rounded-xl py-2 text-sm font-bold', splitValid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600')}>
                    {splitValid ? '✓ Payment complete' : `Still needed: ${formatCurrency(total - splitCashCents - splitCardCents)}`}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-5">
              <button onClick={handleCheckout}
                disabled={loading || (paymentMethod === 'cash' && cashTenderedCents > 0 && cashTenderedCents < total) || (paymentMethod === 'split' && !splitValid)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-base shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2">
                {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                {loading ? 'Processing…' : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NumPad overlay */}
      {showNumPad && (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <NumPad value={numPadTarget} onChange={setNumPadTarget} onClose={onNumPadDone} />
        </div>
      )}

      {/* Custom item modal */}
      {showCustomItem && <CustomItemModal onAdd={addCustomItem} onClose={() => setShowCustomItem(false)} />}
    </div>
  );
}

// ─── RECEIPT ─────────────────────────────────────────────────────────────────
function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const now = new Date();
  const handlePrint = () => window.print();
  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden receipt-printable">
        <div className="bg-gradient-to-br from-emerald-400 to-green-600 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircleIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold">Sale Complete!</h2>
          <p className="text-emerald-100 text-sm mt-1 font-mono">#{data.saleId.substring(0, 8).toUpperCase()}</p>
          {data.customerName && <p className="text-white/80 text-xs mt-1">{data.customerName}</p>}
        </div>
        <div className="px-6 py-5">
          <p className="text-xs text-slate-400 text-center mb-4">{now.toLocaleString()}</p>
          <div className="space-y-1.5 mb-4">
            {data.items.map((i) => (
              <div key={i.product_id} className="flex justify-between text-sm text-slate-600">
                <span className="truncate mr-2">{i.quantity}× {i.name}</span>
                <span className="shrink-0">{formatCurrency(i.total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
            {data.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount {data.couponCode ? `(${data.couponCode})` : ''}</span>
                <span>-{formatCurrency(data.discount)}</span>
              </div>
            )}
            {data.tax > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>{formatCurrency(data.tax)}</span></div>}
            <div className="flex justify-between font-extrabold text-xl text-slate-900 pt-2 border-t-2 border-slate-200">
              <span>Total</span><span>{formatCurrency(data.total)}</span>
            </div>
            {data.change > 0 && (
              <div className="flex justify-between text-indigo-600 font-bold"><span>Change</span><span>{formatCurrency(data.change)}</span></div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="capitalize font-medium">{data.paymentMethod}</span> payment
          </div>
          <p className="text-center text-xs text-slate-300 mt-2">Thank you for your purchase!</p>
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={handlePrint} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
            <PrinterIcon className="w-4 h-4" /> Print
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:from-indigo-700 hover:to-violet-700 transition-all">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
