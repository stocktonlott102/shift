import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HelpFeedbackClient from './HelpFeedbackClient';

export default async function HelpFeedbackPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return <HelpFeedbackClient />;
}
