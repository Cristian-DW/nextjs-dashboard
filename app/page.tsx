import DeltuxLogo from '@/app/ui/deltux-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { playfair } from '@/app/ui/fonts';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex h-20 shrink-0 items-center justify-between p-6 md:h-24">
        <div className="flex items-center rounded-lg bg-slate-900 p-4">
          <DeltuxLogo />
        </div>
      </div>

      <div className="mt-4 flex grow flex-col gap-4 md:flex-row px-6 pb-6">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-white px-6 py-10 md:w-2/5 md:px-20 shadow-xl border border-slate-100">
          <div className={`${playfair.className} text-xl text-slate-800 md:text-5xl md:leading-tight font-bold`}>
            Elevate your business with <strong>Deltux.</strong>
          </div>
          <p className="text-lg text-slate-600">
            The premium invoicing platform designed for modern professionals. Manage clients, track payments, and look good doing it.
          </p>
          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-500 md:text-base shadow-lg shadow-primary-500/30"
          >
            <span>Get Started</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>

        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12 bg-slate-900 rounded-lg shadow-2xl overflow-hidden relative">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary-900/20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl"></div>

          <div className="relative z-10 text-center">
            <h2 className={`${playfair.className} text-3xl text-white mb-4`}>Dashboard Preview</h2>
            <div className="w-full h-64 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 flex items-center justify-center text-slate-400">
              [Interactive Graph Placeholder]
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
