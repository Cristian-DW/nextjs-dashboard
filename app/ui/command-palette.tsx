'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon, XMarkIcon, ShoppingCartIcon, CubeIcon,
  ChartBarIcon, UserGroupIcon, TagIcon, TruckIcon, Cog6ToothIcon,
  DocumentChartBarIcon, ArchiveBoxIcon, ClockIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useT } from '@/app/lib/i18n/context';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const cp = t.commandPalette;

  const COMMANDS = [
    { id: 'dash',         label: cp.commands.dashboard.label,  description: cp.commands.dashboard.desc,  icon: ChartBarIcon,       href: '/dashboard',                    keywords: 'panel inicio home analytics' },
    { id: 'pos',          label: cp.commands.pos.label,         description: cp.commands.pos.desc,         icon: ShoppingCartIcon,   href: '/dashboard/pos',                keywords: 'terminal caja registradora cashier sale venta' },
    { id: 'sales',        label: cp.commands.sales.label,       description: cp.commands.sales.desc,       icon: ClockIcon,          href: '/dashboard/invoices',           keywords: 'ventas facturas historial invoices transactions' },
    { id: 'products',     label: cp.commands.products.label,    description: cp.commands.products.desc,    icon: CubeIcon,           href: '/dashboard/products',           keywords: 'productos catalogo catalog items' },
    { id: 'inventory',    label: cp.commands.inventory.label,   description: cp.commands.inventory.desc,   icon: ArchiveBoxIcon,     href: '/dashboard/inventory',          keywords: 'inventario stock almacen warehouse' },
    { id: 'customers',    label: cp.commands.customers.label,   description: cp.commands.customers.desc,   icon: UserGroupIcon,      href: '/dashboard/customers',          keywords: 'clientes clients users people' },
    { id: 'suppliers',    label: cp.commands.suppliers.label,   description: cp.commands.suppliers.desc,   icon: TruckIcon,          href: '/dashboard/suppliers',          keywords: 'proveedores vendors purchase' },
    { id: 'discounts',    label: cp.commands.discounts.label,   description: cp.commands.discounts.desc,   icon: TagIcon,            href: '/dashboard/discounts',          keywords: 'descuentos cupones promo codes coupons' },
    { id: 'reports',      label: cp.commands.reports.label,     description: cp.commands.reports.desc,     icon: DocumentChartBarIcon, href: '/dashboard/reports',          keywords: 'reportes export csv data estadisticas' },
    { id: 'settings',     label: cp.commands.settings.label,    description: cp.commands.settings.desc,    icon: Cog6ToothIcon,      href: '/dashboard/settings',           keywords: 'configuracion settings impuesto tax negocio business' },
    { id: 'add-product',  label: cp.commands.addProduct.label,  description: cp.commands.addProduct.desc,  icon: CubeIcon,           href: '/dashboard/products/create',    keywords: 'nuevo crear create new producto' },
    { id: 'add-customer', label: cp.commands.addCustomer.label, description: cp.commands.addCustomer.desc, icon: UserGroupIcon,      href: '/dashboard/customers/create',   keywords: 'nuevo cliente new customer' },
    { id: 'add-supplier', label: cp.commands.addSupplier.label, description: cp.commands.addSupplier.desc, icon: TruckIcon,          href: '/dashboard/suppliers/create',   keywords: 'nuevo proveedor new supplier' },
    { id: 'orders',       label: cp.commands.orders.label,      description: cp.commands.orders.desc,      icon: TruckIcon,          href: '/dashboard/orders',             keywords: 'ordenes compra po purchase restock' },
  ];

  const filtered = COMMANDS.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.keywords?.toLowerCase().includes(q)
    );
  });

  const openPalette = useCallback(() => {
    setOpen(true); setQuery(''); setSelected(0);
  }, []);

  const close = useCallback(() => {
    setOpen(false); setQuery('');
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open ? close() : openPalette();
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close, openPalette]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) {
      router.push(filtered[selected].href);
      close();
    }
  };

  if (!open) {
    return (
      <button
        onClick={openPalette}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl shadow-black/30 hover:bg-slate-800 transition-all text-xs font-semibold border border-slate-700/50"
        title={`${cp.trigger} (⌘K)`}
      >
        <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline text-slate-400">{cp.trigger}</span>
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={cp.placeholder}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button onClick={close} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              {cp.noResults} &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              const isSelected = i === selected;
              return (
                <button
                  key={cmd.id}
                  onClick={() => { router.push(cmd.href); close(); }}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{cmd.label}</p>
                    {cmd.description && <p className="text-xs text-slate-400">{cmd.description}</p>}
                  </div>
                  {isSelected && <ArrowRightIcon className="w-4 h-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 text-[10px] text-slate-400">
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md font-mono">↑↓</kbd> {cp.navigate}</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md font-mono">↵</kbd> {cp.open}</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md font-mono">Esc</kbd> {cp.close}</span>
        </div>
      </div>
    </div>
  );
}
