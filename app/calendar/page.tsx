import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CalendarPageClient from './CalendarPageClient';

export default async function CalendarPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <CalendarPageClient coachId={user.id} />;
}
