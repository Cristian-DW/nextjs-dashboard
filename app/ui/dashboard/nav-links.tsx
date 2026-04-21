'use client';
import Link from 'next/link';
import clsx from 'clsx';
import {
  ChartBarIcon, ShoppingCartIcon, ClockIcon, CubeIcon,
  ArchiveBoxIcon, UserGroupIcon, TagIcon, TruckIcon,
  DocumentChartBarIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useT } from '@/app/lib/i18n/context';

type NavLink = {
  key: keyof ReturnType<typeof useT>['nav'];
  href: string;
  icon: React.ElementType;
};

const NAV_LINKS: NavLink[] = [
  { key: 'dashboard',  href: '/dashboard',            icon: ChartBarIcon },
  { key: 'pos',        href: '/dashboard/pos',         icon: ShoppingCartIcon },
  { key: 'sales',      href: '/dashboard/invoices',    icon: ClockIcon },
  { key: 'products',   href: '/dashboard/products',    icon: CubeIcon },
  { key: 'inventory',  href: '/dashboard/inventory',   icon: ArchiveBoxIcon },
  { key: 'customers',  href: '/dashboard/customers',   icon: UserGroupIcon },
  { key: 'suppliers',  href: '/dashboard/suppliers',   icon: TruckIcon },
  { key: 'orders',     href: '/dashboard/orders',      icon: TruckIcon },
  { key: 'discounts',  href: '/dashboard/discounts',   icon: TagIcon },
  { key: 'reports',    href: '/dashboard/reports',     icon: DocumentChartBarIcon },
  { key: 'zreport',    href: '/dashboard/zreport',     icon: DocumentChartBarIcon },
  { key: 'settings',   href: '/dashboard/settings',    icon: Cog6ToothIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  const t = useT();

  return (
    <>
      {NAV_LINKS.map(({ key, href, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href));

        return (
          <Link
            key={key}
            href={href}
            className={clsx(
              'flex h-[44px] grow items-center justify-center gap-2 rounded-xl p-2 text-sm font-medium transition-all md:flex-none md:justify-start md:px-3',
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            )}
          >
            <Icon className="w-5 shrink-0" />
            <p className="hidden md:block">{t.nav[key]}</p>
          </Link>
        );
      })}
    </>
  );
}
