'use client';
import Link from 'next/link';
import clsx from 'clsx';
import {
  ChartBarIcon,
  ShoppingCartIcon,
  ClockIcon,
  CubeIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  TagIcon,
  TruckIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'POS Terminal', href: '/dashboard/pos', icon: ShoppingCartIcon },
  { name: 'Sales History', href: '/dashboard/invoices', icon: ClockIcon },
  { name: 'Products', href: '/dashboard/products', icon: CubeIcon },
  { name: 'Inventory', href: '/dashboard/inventory', icon: ArchiveBoxIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: TruckIcon },
  { name: 'Discounts', href: '/dashboard/discounts', icon: TagIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[44px] grow items-center justify-center gap-2 rounded-xl p-2 text-sm font-medium transition-all md:flex-none md:justify-start md:px-3',
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            )}
          >
            <LinkIcon className="w-5 shrink-0" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
