import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { SOURCES, type LanguageCode } from '@/data/sample';

const STORAGE_KEY = 'unedited.reader.v1';
export const DEFAULT_FOLDER = 'Saved';

export type ReadFont = 'serif' | 'sans';
export type HomeView = 'comfortable' | 'focused';
export type FrontSections = { papers: boolean; outside: boolean; continueReading: boolean; trending: boolean };

export type Prefs = {
  appLanguage: LanguageCode;
  sourceLanguages: LanguageCode[];
  readFont: ReadFont;
  devanagariFont: 'match' | 'serif' | 'sans';
  homeView: HomeView;
  /** 0 (S) to 4 (XXL). */
  textSize: number;
  reduceMotion: boolean;
  underlineLinks: boolean;
  topics: string[];
  regions: string[];
  sources: string[];
  front: FrontSections;
  autoDownload: boolean;
  editionReminder: boolean;
  editionTime: string;
};

type Data = {
  onboarded: boolean;
  firstSeen: number | null;
  prefs: Prefs;
  folders: Record<string, string[]>;
  downloaded: string[];
  recent: string[];
  hidden: string[];
  searches: string[];
};

const DEFAULT_PREFS: Prefs = {
  appLanguage: 'en',
  sourceLanguages: ['en'],
  readFont: 'serif',
  devanagariFont: 'match',
  homeView: 'comfortable',
  textSize: 2,
  reduceMotion: false,
  underlineLinks: false,
  topics: [],
  regions: ['India'],
  sources: [],
  front: { papers: true, outside: true, continueReading: true, trending: false },
  autoDownload: false,
  editionReminder: false,
  editionTime: '6:00 AM',
};

const DEFAULT_DATA: Data = {
  onboarded: false,
  firstSeen: null,
  prefs: DEFAULT_PREFS,
  folders: { [DEFAULT_FOLDER]: [] },
  downloaded: [],
  recent: [],
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
  clearDownloads: () => void;
  markViewed: (id: string) => void;
  hide: (id: string) => void;
  addSearch: (q: string) => void;
  clearSearches: () => void;
  resetAll: () => void;
};

const ReaderContext = createContext<ReaderValue | null>(null);

function merge(saved: Partial<Data> | null): Data {
  if (!saved) return DEFAULT_DATA;
  return {
    ...DEFAULT_DATA,
    ...saved,
    prefs: { ...DEFAULT_PREFS, ...saved.prefs, front: { ...DEFAULT_PREFS.front, ...saved.prefs?.front } },
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
        const downloaded =
          !current && d.prefs.autoDownload && !d.downloaded.includes(id) ? [...d.downloaded, id] : d.downloaded;
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
        return { ...d, folders };
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

  const clearDownloads = useCallback(() => update((d) => ({ ...d, downloaded: [] })), [update]);

  const markViewed = useCallback(
    (id: string) => update((d) => ({ ...d, recent: [id, ...d.recent.filter((x) => x !== id)].slice(0, 20) })),
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
      clearDownloads,
      markViewed,
      hide,
      addSearch,
      clearSearches,
      resetAll,
    }),
    [
      data, ready, setPrefs, finishOnboarding, isSaved, folderOf, toggleSaved, moveToFolder, createFolder,
      toggleDownload, clearDownloads, markViewed, hide, addSearch, clearSearches, resetAll,
    ],
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

export function useReader(): ReaderValue {
  const value = useContext(ReaderContext);
  if (!value) throw new Error('useReader must be used inside ReaderProvider');
  return value;
}
