import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';

/**
 * Keeps a signed-in reader's settings, folders and folder downloads in their account (reader_state), so they
 * follow them to every device (WebSyncHint, Sign out "Kept"). Downloaded articles stay on each device.
 * On sign-in: the account's copy wins if it has one; otherwise this device's choices are saved to it.
 * After that, changes are saved a couple of seconds after they're made.
 */
export function useAccountSync() {
  const { status } = useSession();
  const { ready, prefs, folders, downloadedFolders, firstSeen, importSynced } = useReader();
  const userId = useRef<string | null>(null);
  const pulled = useRef(false);
  const latest = useRef({ prefs, folders, downloaded_folders: downloadedFolders, first_seen: firstSeen });
  useEffect(() => {
    latest.current = { prefs, folders, downloaded_folders: downloadedFolders, first_seen: firstSeen };
  });

  // Pull once per sign-in.
  useEffect(() => {
    if (!supabase || !ready || status !== 'signedIn') {
      pulled.current = false;
      userId.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid || cancelled) return;
      userId.current = uid;
      const { data } = await supabase.from('reader_state').select('prefs, folders, downloaded_folders, first_seen').eq('user_id', uid).maybeSingle();
      if (cancelled) return;
      if (data && Object.keys(data.prefs ?? {}).length)
        importSynced({ prefs: data.prefs, folders: data.folders ?? {}, downloadedFolders: data.downloaded_folders ?? [], firstSeen: data.first_seen });
      // A new account: keep what this device already has.
      else await supabase.from('reader_state').upsert({ user_id: uid, ...latest.current, updated_at: new Date().toISOString() });
      pulled.current = true;
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, status, importSynced]);

  // Push changes (after the first pull, so a new device doesn't overwrite the account).
  const state = JSON.stringify({ prefs, folders, downloadedFolders, firstSeen });
  useEffect(() => {
    if (!supabase || status !== 'signedIn' || !pulled.current || !userId.current) return;
    const uid = userId.current;
    const timer = setTimeout(() => {
      supabase
        ?.from('reader_state')
        .upsert({ user_id: uid, prefs, folders, downloaded_folders: downloadedFolders, first_seen: firstSeen, updated_at: new Date().toISOString() })
        .then(() => {});
    }, 2000);
    return () => clearTimeout(timer);
    // `state` stands for the synced values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, status]);
}
