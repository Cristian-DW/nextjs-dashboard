import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import LanguageToggle from '@/app/ui/language-toggle';
import { PowerIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col bg-slate-950 border-r border-slate-800/60">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/60 hover:bg-slate-900/60 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 shrink-0">
          <ShoppingCartIcon className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block">
          <p className="text-white font-extrabold text-sm leading-tight tracking-tight">
            Deltux POS
          </p>
          <p className="text-slate-500 text-[10px] font-medium mt-0.5">
            Point of Sale
          </p>
        </div>
      </Link>

      {/* Nav Links (client — uses translations) */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NavLinks />
      </div>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-800/60 space-y-1">
        {/* Online status */}
        <OnlineStatus />

        {/* Language toggle (client component) */}
        <LanguageToggle />

        {/* Sign out */}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <SignOutButton />
        </form>
      </div>
    </div>
  );
}

// ── Small client components for sign-out button and status indicator
// We keep them simple so server actions still work in the form above.

function OnlineStatus() {
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-2">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <span className="text-xs text-slate-500">Sistema en Línea</span>
    </div>
  );
}

function SignOutButton() {
  return (
    <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl p-2 text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 md:justify-start md:px-3 transition-all">
      <PowerIcon className="w-5 h-5 shrink-0" />
      <span className="hidden md:block">Cerrar Sesión</span>
    </button>
  );
}
