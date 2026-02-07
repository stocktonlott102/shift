import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import FinancialsPageClient from './FinancialsPageClient';
import { getFinancialSummary } from '@/app/actions/financial-actions';

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

  const result = await getFinancialSummary(currentYear);

  return (
    <>
      <Navigation />
      <FinancialsPageClient
        initialData={result.success && result.data ? result.data : null}
        initialYear={currentYear}
        initialMonth={currentMonth}
        initialError={!result.success ? result.error || 'Failed to load financial data.' : null}
      />
    </>
  );
}
