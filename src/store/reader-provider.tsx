import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { SOURCES, type LanguageCode } from '@/data/sample';

const STORAGE_KEY = 'unedited.reader.v1';
export const DEFAULT_FOLDER = 'Saved';
/** Recently viewed keeps the last 20 stories opened, on this device only. */
export const HISTORY_LIMIT = 20;

export type ReadFont = 'serif' | 'sans';
export type HomeView = 'comfortable' | 'focused';
export type FrontSections = { papers: boolean; outside: boolean; continueReading: boolean; trending: boolean };

/** You › Notifications (Notifications + NotificationDelivery boards). */
export type NotifyPrefs = {
  /** "Allow notifications": the device or browser permission was granted and the reader wants them. */
  all: boolean;
  /** Morning Edition is ready (one a day, never with a headline). */
  edition: boolean;
  time: '6:00' | '6:30' | '7:00' | '7:30' | '8:00' | '9:00';
  days: string[];
  sound: boolean;
  vibrate: boolean;
  /** Quiet hours 10 PM to 7 AM: everything waits until they end. */
  quiet: boolean;
  /** Big stories: ≥5 of the reader's sources (or 60%) within 6h, once per story. Off by default. */
  big: boolean;
  /** Papers & Reports: a Sunday note. */
  papers: boolean;
  /** A downloaded folder is ready to read offline. */
  folder: boolean;
  /** Topic and source alerts, only for what the reader ticks. */
  alerts: boolean;
  alertTopics: string[];
  alertSources: string[];
  /** Cap for Big story + topic + source alerts per day. The edition and downloads don't count. */
  cap: 1 | 3 | 5;
  /** When the one-time "Want a nudge…" ask was shown or answered (shown on day 2, never in onboarding). */
  askedOn: number | null;
};

export type Prefs = {
  appLanguage: LanguageCode;
  sourceLanguages: LanguageCode[];
  readFont: ReadFont;
  devanagariFont: 'match' | 'serif' | 'sans';
  homeView: HomeView;
  /** 0 (S) to 4 (XXL); 1 (M) is the standard size. */
  textSize: number;
  reduceMotion: boolean;
  underlineLinks: boolean;
  /** Dyslexia-friendly reading font (Atkinson Hyperlegible). A switch, not a third reading font. */
  dyslexiaFont: boolean;
  /** Accessibility (YouAccessibility board). */
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  /** Use the phone's (or browser's) text size instead of the S–XXL step. */
  matchSystemSize: boolean;
  colourMode: 'standard' | 'redgreen' | 'mono';
  /** Don't rely on colour alone: labels and underlines wherever colour carries meaning. */
  colourCues: boolean;
  higherContrast: boolean;
  boldText: boolean;
  strongFocus: boolean;
  readingLine: boolean;
  tracking: 'normal' | 'wide' | 'wider';
  largeTargets: boolean;
  /** Previous / Next buttons in Feed instead of relying on swipes. */
  swipeButtons: boolean;
  /** Screen readers read the photo credit before the story. */
  readCredits: boolean;
  topics: string[];
  regions: string[];
  sources: string[];
  front: FrontSections;
  autoDownload: boolean;
  notify: NotifyPrefs;
};

type Data = {
  /** Shape of the saved data. 2: text size step 1 is standard (was 2). */
  version: number;
  onboarded: boolean;
  firstSeen: number | null;
  prefs: Prefs;
  folders: Record<string, string[]>;
  downloaded: string[];
  /** Folders the reader downloaded as a whole: everything in them, and every later save into them, downloads. */
  downloadedFolders: string[];
  recent: string[];
  /** When each recent story was last opened (ms). */
  viewedAt: Record<string, number>;
  hidden: string[];
  searches: string[];
};

const DEFAULT_PREFS: Prefs = {
  appLanguage: 'en',
  sourceLanguages: ['en'],
  readFont: 'serif',
  devanagariFont: 'match',
  homeView: 'comfortable',
  textSize: 1,
  reduceMotion: false,
  underlineLinks: false,
  dyslexiaFont: false,
  lineSpacing: 'normal',
  matchSystemSize: false,
  colourMode: 'standard',
  colourCues: false,
  higherContrast: false,
  boldText: false,
  strongFocus: false,
  readingLine: false,
  tracking: 'normal',
  largeTargets: false,
  swipeButtons: false,
  readCredits: false,
  topics: [],
  regions: ['India'],
  sources: [],
  front: { papers: true, outside: true, continueReading: true, trending: false },
  autoDownload: false,
  notify: {
    all: false,
    edition: true,
    time: '6:00',
    days: ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'],
    sound: true,
    vibrate: true,
    quiet: true,
    big: false,
    papers: false,
    folder: true,
    alerts: false,
    alertTopics: [],
    alertSources: [],
    cap: 3,
    askedOn: null,
  },
};

const DEFAULT_DATA: Data = {
  version: 2,
  onboarded: false,
  firstSeen: null,
  prefs: DEFAULT_PREFS,
  folders: { [DEFAULT_FOLDER]: [] },
  downloaded: [],
  downloadedFolders: [],
  recent: [],
  viewedAt: {},
  hidden: [],
  searches: [],
};

type ReaderValue = Data & {
  ready: boolean;
  setPrefs: (patch: Partial<Prefs>) => void;
  finishOnboarding: () => void;
  isSaved: (id: string) => boolean;
  folderOf: (id: string) => string | null;
  /** Saves to the default folder, or removes from every folder when already saved. Returns what happened. */
  toggleSaved: (id: string) => 'saved' | 'removed';
  moveToFolder: (id: string, folder: string) => void;
  createFolder: (name: string) => boolean;
  toggleDownload: (id: string) => void;
  /** Folder ↓ Download / Remove. Returns true when the folder is now downloaded. */
  toggleFolderDownload: (folder: string) => boolean;
  clearDownloads: () => void;
  markViewed: (id: string) => void;
  hide: (id: string) => void;
  addSearch: (q: string) => void;
  clearSearches: () => void;
  removeSearch: (q: string) => void;
  resetAll: () => void;
};

const ReaderContext = createContext<ReaderValue | null>(null);

function merge(saved: Partial<Data> | null): Data {
  if (!saved) return DEFAULT_DATA;
  const prefs = {
    ...DEFAULT_PREFS,
    ...saved.prefs,
    front: { ...DEFAULT_PREFS.front, ...saved.prefs?.front },
    notify: { ...DEFAULT_PREFS.notify, ...saved.prefs?.notify },
  };
  // v1 counted text size from S = 0 with the standard size at 2; v2 puts standard at 1 (S M L XL XXL, M standard).
  if ((saved.version ?? 1) < 2) prefs.textSize = Math.max(0, prefs.textSize - 1);
  return {
    ...DEFAULT_DATA,
    ...saved,
    version: DEFAULT_DATA.version,
    prefs,
    folders: { ...DEFAULT_DATA.folders, ...saved.folders },
  };
}

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData(merge(JSON.parse(raw)));
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  // Web: lets plain CSS (and the theme fade) see accessibility settings: reduce motion, strong focus outline,
  // underlined links.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.toggleAttribute('data-reduce-motion', data.prefs.reduceMotion);
    root.toggleAttribute('data-focus-strong', data.prefs.strongFocus);
    root.toggleAttribute('data-underline-links', data.prefs.underlineLinks || data.prefs.colourCues || data.prefs.colourMode === 'mono');
  }, [data.prefs.reduceMotion, data.prefs.strongFocus, data.prefs.underlineLinks, data.prefs.colourCues, data.prefs.colourMode]);

  const update = useCallback((fn: (d: Data) => Data) => setData(fn), []);

  const setPrefs = useCallback((patch: Partial<Prefs>) => update((d) => ({ ...d, prefs: { ...d.prefs, ...patch } })), [update]);

  const finishOnboarding = useCallback(
    () =>
      update((d) => ({
        ...d,
        onboarded: true,
        firstSeen: d.firstSeen ?? Date.now(),
        prefs: {
          ...d.prefs,
          sources: d.prefs.sources.length ? d.prefs.sources : SOURCES.slice(0, 3).map((s) => s.id),
          topics: d.prefs.topics.length ? d.prefs.topics : ['India', 'Cities', 'Technology'],
        },
      })),
    [update],
  );

  const folderOf = useCallback(
    (id: string) => Object.keys(data.folders).find((f) => data.folders[f].includes(id)) ?? null,
    [data.folders],
  );
  const isSaved = useCallback((id: string) => folderOf(id) !== null, [folderOf]);

  const toggleSaved = useCallback(
    (id: string): 'saved' | 'removed' => {
      const current = Object.keys(data.folders).find((f) => data.folders[f].includes(id));
      update((d) => {
        const folders: Record<string, string[]> = {};
        for (const f of Object.keys(d.folders)) folders[f] = d.folders[f].filter((x) => x !== id);
        if (!current) folders[DEFAULT_FOLDER] = [id, ...(folders[DEFAULT_FOLDER] ?? [])];
        const autoDl = d.prefs.autoDownload || d.downloadedFolders.includes(DEFAULT_FOLDER);
        const downloaded = !current && autoDl && !d.downloaded.includes(id) ? [...d.downloaded, id] : d.downloaded;
        return { ...d, folders, downloaded };
      });
      return current ? 'removed' : 'saved';
    },
    [data.folders, update],
  );

  const moveToFolder = useCallback(
    (id: string, folder: string) =>
      update((d) => {
        const folders: Record<string, string[]> = {};
        for (const f of Object.keys(d.folders)) folders[f] = d.folders[f].filter((x) => x !== id);
        folders[folder] = [id, ...(folders[folder] ?? [])];
        const downloaded =
          d.downloadedFolders.includes(folder) && !d.downloaded.includes(id) ? [...d.downloaded, id] : d.downloaded;
        return { ...d, folders, downloaded };
      }),
    [update],
  );

  const createFolder = useCallback(
    (name: string) => {
      const clean = name.trim();
      if (!clean || data.folders[clean]) return false;
      update((d) => ({ ...d, folders: { ...d.folders, [clean]: [] } }));
      return true;
    },
    [data.folders, update],
  );

  const toggleDownload = useCallback(
    (id: string) =>
      update((d) => ({
        ...d,
        downloaded: d.downloaded.includes(id) ? d.downloaded.filter((x) => x !== id) : [...d.downloaded, id],
      })),
    [update],
  );

  const toggleFolderDownload = useCallback(
    (folder: string) => {
      const on = !data.downloadedFolders.includes(folder);
      update((d) => {
        const ids = d.folders[folder] ?? [];
        return {
          ...d,
          downloadedFolders: on ? [...d.downloadedFolders, folder] : d.downloadedFolders.filter((f) => f !== folder),
          downloaded: on ? [...new Set([...d.downloaded, ...ids])] : d.downloaded.filter((x) => !ids.includes(x)),
        };
      });
      return on;
    },
    [data.downloadedFolders, update],
  );

  const clearDownloads = useCallback(() => update((d) => ({ ...d, downloaded: [], downloadedFolders: [] })), [update]);

  const markViewed = useCallback(
    (id: string) =>
      update((d) => {
        const recent = [id, ...d.recent.filter((x) => x !== id)].slice(0, HISTORY_LIMIT);
        const viewedAt = Object.fromEntries(recent.map((x) => [x, x === id ? Date.now() : (d.viewedAt[x] ?? Date.now())]));
        return { ...d, recent, viewedAt };
      }),
    [update],
  );

  const hide = useCallback((id: string) => update((d) => ({ ...d, hidden: [...new Set([...d.hidden, id])] })), [update]);

  const addSearch = useCallback(
    (q: string) => {
      const clean = q.trim();
      if (!clean) return;
      update((d) => ({ ...d, searches: [clean, ...d.searches.filter((x) => x !== clean)].slice(0, 6) }));
    },
    [update],
  );
  const clearSearches = useCallback(() => update((d) => ({ ...d, searches: [] })), [update]);
  const removeSearch = useCallback(
    (q: string) => update((d) => ({ ...d, searches: d.searches.filter((x) => x !== q) })),
    [update],
  );

  const resetAll = useCallback(() => setData(DEFAULT_DATA), []);

  const value = useMemo<ReaderValue>(
    () => ({
      ...data,
      ready,
      setPrefs,
      finishOnboarding,
      isSaved,
      folderOf,
      toggleSaved,
      moveToFolder,
      createFolder,
      toggleDownload,
      toggleFolderDownload,
      clearDownloads,
      markViewed,
      hide,
      addSearch,
      clearSearches,
      removeSearch,
      resetAll,
    }),
    [
      data, ready, setPrefs, finishOnboarding, isSaved, folderOf, toggleSaved, moveToFolder, createFolder,
      toggleDownload, toggleFolderDownload, clearDownloads, markViewed, hide, addSearch, clearSearches, removeSearch, resetAll,
    ],
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

export function useReader(): ReaderValue {
  const value = useContext(ReaderContext);
  if (!value) throw new Error('useReader must be used inside ReaderProvider');
  return value;
}
