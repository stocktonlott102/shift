import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import FinancialsPageClient from './FinancialsPageClient';
import { getFinancialSummary } from '@/app/actions/financial-actions';
import { getExpenseSummary } from '@/app/actions/expense-actions';

export default async function FinancialsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [financialResult, expenseResult] = await Promise.all([
    getFinancialSummary(currentYear),
    getExpenseSummary(currentYear),
  ]);

  return (
    <>
      <Navigation />
      <FinancialsPageClient
        initialData={financialResult.success && financialResult.data ? financialResult.data : null}
        initialExpenseData={expenseResult.success && expenseResult.data ? expenseResult.data : null}
        initialYear={currentYear}
        initialMonth={currentMonth}
        initialError={!financialResult.success ? financialResult.error || 'Failed to load financial data.' : null}
      />
    </>
  );
}
