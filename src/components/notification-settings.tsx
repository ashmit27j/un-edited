import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { useToast } from '@/components/toast';
import { SOURCES } from '@/data/sample';
import { permissionState, requestPermission, scheduleEdition, type Permission } from '@/lib/notifications';
import { useSession } from '@/session/session-provider';
import { useReader, type NotifyPrefs } from '@/store/reader-provider';

export const TIMES: { value: NotifyPrefs['time']; label: string }[] = [
  { value: '6:00', label: '6:00 AM' },
  { value: '6:30', label: '6:30 AM' },
  { value: '7:00', label: '7:00 AM' },
  { value: '7:30', label: '7:30 AM' },
  { value: '8:00', label: '8:00 AM' },
  { value: '9:00', label: '9:00 AM' },
];

export const DAYS: { short: string; full: string }[] = [
  { short: 'M', full: 'Monday' },
  { short: 'T', full: 'Tuesday' },
  { short: 'W', full: 'Wednesday' },
  { short: 'Th', full: 'Thursday' },
  { short: 'F', full: 'Friday' },
  { short: 'S', full: 'Saturday' },
  { short: 'Su', full: 'Sunday' },
];

/**
 * State and actions for You › Notifications (the combined Notifications board), shared by the phone screen and
 * the web You page. "Allow notifications" asks the phone or browser once; if it's blocked there, the screen says so.
 */
export function useNotificationSettings() {
  const { prefs, setPrefs } = useReader();
  const { status } = useSession();
  const toast = useToast();
  const n = prefs.notify;
  const [permission, setPermission] = useState<Permission>('default');
  const web = Platform.OS === 'web';
  const guest = status !== 'signedIn';

  useEffect(() => {
    permissionState()
      .then(setPermission)
      .catch(() => setPermission('unsupported'));
  }, []);

  const set = (patch: Partial<NotifyPrefs>) => setPrefs({ notify: { ...n, ...patch } });

  const setAll = async (on: boolean) => {
    if (!on) return set({ all: false });
    const result = await requestPermission().catch(() => 'unsupported' as Permission);
    setPermission(result);
    if (result === 'granted') set({ all: true, askedOn: n.askedOn ?? Date.now() });
    else if (result === 'unsupported')
      toast.show(
        web ? 'This browser can’t show notifications. On iPhone, add Un:edited to your Home Screen first.' : 'Notifications aren’t available here.',
      );
  };

  const toggleIn = (key: 'days' | 'alertTopics' | 'alertSources', value: string) =>
    set({ [key]: n[key].includes(value) ? n[key].filter((x) => x !== value) : [...n[key], value] });

  const dayCount = n.days.length;
  return {
    n,
    set,
    setAll,
    toggleIn,
    web,
    guest,
    blocked: permission === 'denied',
    unsupported: permission === 'unsupported',
    openSettings: () => (web ? toast.show('Allow notifications for this site in your browser’s settings.') : Linking.openSettings()),
    daysNote: dayCount === 7 ? 'Every day.' : dayCount === 0 ? 'No days picked. No edition notifications.' : `${dayCount} days a week.`,
    topics: prefs.topics,
    outlets: SOURCES.filter((s) => prefs.sources.includes(s.id)),
    headline: guest ? 'Your morning edition is ready' : 'Morning Edition Nº 12 is ready',
    shownTime: n.all && n.edition ? (TIMES.find((t) => t.value === n.time)?.label ?? '6:00 AM') : 'off',
  };
}

/** Keeps the phone's scheduled edition reminder in step with the settings (no-op on web). */
export function useEditionSchedule() {
  const { prefs, ready } = useReader();
  const n = prefs.notify;
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    scheduleEdition(n).catch(() => {});
    // Only the fields that change the schedule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, n.all, n.edition, n.time, n.days.join(), n.quiet, n.sound]);
}
