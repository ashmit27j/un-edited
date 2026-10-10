import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useToast } from '@/components/toast';
import { useNews } from '@/data/news';
import { useReader } from '@/store/reader-provider';

/**
 * Once live news is loaded, drops picked outlets that no longer exist (the made-up sample outlets from before
 * live news, or an outlet taken off the list). If none are left, the reader is sent to Your news to pick real
 * ones, once, with a toast saying why.
 */
export function useSourceCleanup() {
  const { status, sources } = useNews();
  const { ready, onboarded, prefs, setPrefs } = useReader();
  const router = useRouter();
  const { show } = useToast();

  useEffect(() => {
    if (status !== 'live' || !ready || !sources.length || !prefs.sources.length) return;
    const live = new Set(sources.map((s) => s.id));
    const kept = prefs.sources.filter((id) => live.has(id));
    if (kept.length === prefs.sources.length) return;
    setPrefs({ sources: kept });
    if (!kept.length && onboarded) {
      show('Your outlets were sample ones. Pick the real outlets you trust.');
      router.navigate('/manage');
    }
  }, [status, sources, ready, onboarded, prefs.sources, setPrefs, show, router]);
}
