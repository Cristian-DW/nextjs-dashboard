import { sql } from '@/app/lib/db';
import { saveSettings } from '@/app/lib/actions';
import { playfair } from '@/app/ui/fonts';
import {
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await sql`SELECT key, value FROM settings`;
    return Object.fromEntries(res.rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Cog6ToothIcon className="w-8 h-8 text-indigo-500" />
        <h1 className={`${playfair.className} text-2xl md:text-3xl font-bold text-slate-900`}>Settings</h1>
      </div>

      <form action={saveSettings} className="space-y-6">
        {/* Business Info */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <BuildingStorefrontIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Business Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Business Name</label>
              <input name="business_name" defaultValue={settings.business_name || 'Deltux POS'}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input name="business_phone" defaultValue={settings.business_phone || ''}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Currency</label>
              <select name="currency" defaultValue={settings.currency || 'USD'}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="MXN">MXN — Mexican Peso</option>
                <option value="COP">COP — Colombian Peso</option>
                <option value="BRL">BRL — Brazilian Real</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
              <input name="business_address" defaultValue={settings.business_address || ''}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </section>

        {/* POS Defaults */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <CurrencyDollarIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">POS Defaults</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Default Tax Rate (%)</label>
              <input name="default_tax_rate" type="number" min="0" max="100" step="0.01"
                defaultValue={settings.default_tax_rate || '0'}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <p className="text-xs text-slate-400 mt-1">Applied automatically on every new sale</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Low Stock Threshold (default)</label>
              <input name="default_low_stock" type="number" min="0"
                defaultValue={settings.default_low_stock || '5'}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </section>

        {/* Receipt */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Receipt</h2>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Receipt Footer Message</label>
            <textarea name="receipt_footer" rows={2} defaultValue={settings.receipt_footer || 'Thank you for your purchase!'}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit"
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
