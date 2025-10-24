'use client';

import { useRouter } from 'next/navigation';
import ClientForm from '@/components/ClientForm';

interface NewClientPageClientProps {
  coachId: string;
}

/**
 * Client-side wrapper for the New Client Page
 *
 * Purpose: Handles client-side navigation after successful form submission
 * - Uses Next.js router to redirect to /clients after client creation
 * - Wraps the ClientForm component and provides onSuccess callback
 */
export default function NewClientPageClient({ coachId }: NewClientPageClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    // Navigate back to clients list after successful creation
    router.push('/clients');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
      <ClientForm coachId={coachId} onSuccess={handleSuccess} />
    </div>
  );
}
