'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { MonthlyIncome } from '@/lib/types/financial';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthlyIncomeChartProps {
  data: MonthlyIncome[];
  year: number;
}

export default function MonthlyIncomeChart({ data, year }: MonthlyIncomeChartProps) {
  const chartData = SHORT_MONTHS.map((name, i) => ({
    name,
    income: data[i]?.totalPaid || 0,
  }));

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Monthly Income — {year}
      </h2>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Income']}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Bar
                dataKey="income"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
