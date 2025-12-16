import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OutstandingLessonsClient from './OutstandingLessonsClient';

export default async function OutstandingLessonsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  return <OutstandingLessonsClient coachId={user.id} />;
}
