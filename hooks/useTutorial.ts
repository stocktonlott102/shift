'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseTutorialReturn {
  showTutorial: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
}

export function useTutorial(): UseTutorialReturn {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) return;

        const hasSeen = user.user_metadata?.has_seen_tutorial === true;
        if (!hasSeen) {
          setShowTutorial(true);
        }
      } catch {
        // Default to not showing tutorial on error to avoid blocking the user
      }
    };

    checkTutorialStatus();
  }, []);

  const closeTutorial = async () => {
    setShowTutorial(false);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { has_seen_tutorial: true },
      });
    } catch {
      // If saving fails, the user will see the tutorial again next login
    }
  };

  const openTutorial = () => {
    setShowTutorial(true);
  };

  return { showTutorial, openTutorial, closeTutorial };
}
