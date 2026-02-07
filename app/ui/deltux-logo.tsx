import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { playfair } from '@/app/ui/fonts';

export default function DeltuxLogo() {
    return (
        <div
            className={`${playfair.className} flex flex-row items-center leading-none text-white`}
        >
            <CubeTransparentIcon className="h-12 w-12 rotate-[15deg]" />
            <p className="text-[44px] ml-4 font-bold tracking-tighter">Deltux</p>
        </div>
    );
}
