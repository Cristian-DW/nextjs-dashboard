import { generateYAxis } from '@/app/lib/utils';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { inter } from '@/app/ui/fonts';
import { Revenue } from '@/app/lib/definitions';
import { fetchRevenue } from '@/app/lib/data';

// This component is representational only.
// For data visualization UI, check out:
// https://www.tremor.so/
// https://www.chartjs.org/
// https://airbnb.io/visx/

export default async function RevenueChart() {
  const revenue = await fetchRevenue();

  const chartHeight = 350;

  const { yAxisLabels, topLabel } = generateYAxis(revenue);

  if (!revenue || revenue.length === 0) {
    return <p className="mt-4 text-gray-400">No data available.</p>;
  }

  return (
    <div className="w-full md:col-span-4">
      <h2 className={`${inter.className} mb-4 text-xl md:text-2xl font-bold text-slate-800`}>
        Recent Revenue
      </h2>

      <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
        <div className="mt-0 grid grid-cols-12 items-end gap-2 rounded-md bg-slate-50 p-4 sm:grid-cols-13 md:gap-4 border border-slate-100">
          <div
            className="mb-6 hidden flex-col justify-between text-sm text-slate-400 sm:flex"
            style={{ height: `${chartHeight}px` }}
          >
            {yAxisLabels.map((label) => (
              <p key={label}>{label}</p>
            ))}
          </div>

          {revenue.map((month) => (
            <div key={month.month} className="flex flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-primary-500 hover:bg-primary-400 transition-colors"
                style={{
                  height: `${(chartHeight / topLabel) * month.revenue}px`,
                }}
              ></div>
              <p className="-rotate-90 text-sm text-slate-500 sm:rotate-0 font-medium">
                {month.month}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <CalendarIcon className="h-5 w-5 text-slate-400" />
          <h3 className="ml-2 text-sm text-slate-500 ">Last 12 months</h3>
        </div>
      </div>
    </div>
  );
}
