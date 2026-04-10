import SideNav from '@/app/ui/dashboard/sidenav';
import CommandPalette from '@/app/ui/command-palette';
import { LocaleProvider } from '@/app/lib/i18n/context';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-slate-50">
        {/* Sidebar */}
        <div className="w-full flex-none md:w-56 lg:w-64">
          <SideNav />
        </div>

        {/* Main content */}
        <div className="flex-grow p-4 md:overflow-y-auto md:p-6 lg:p-8">
          {children}
        </div>

        {/* Global Command Palette */}
        <CommandPalette />
      </div>
    </LocaleProvider>
  );
}
