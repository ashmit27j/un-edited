import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { MoreButton, SaveButton, StoryRow, useOpenStory, storyLink } from '@/components/story';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { SectionHeader } from '@/components/ui';
import { WidePage } from '@/components/wide/page';
import { ago, sourceById, storyById, type Story } from '@/data/sample';
import { useSession } from '@/session/session-provider';
import { DEFAULT_FOLDER, useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const HINT_KEY = 'unedited.syncHintSeen';
const GRID_GAP = 20;
const TILE_MIN = 200;

/** Library on web at 768px and wider (WebLibrary): folder stacks in a grid, the open folder below. */
export function WideLibrary({ onNewFolder }: { onNewFolder: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { status } = useSession();
  const { folders, downloaded, downloadedFolders, recent, toggleFolderDownload } = useReader();
  const [current, setCurrent] = useState(DEFAULT_FOLDER);
  const [gridWidth, setGridWidth] = useState(0);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HINT_KEY)
      .then((seen) => setHint(!seen))
      .catch(() => {});
  }, []);
  const dismissHint = () => {
    setHint(false);
    AsyncStorage.setItem(HINT_KEY, '1').catch(() => {});
  };

  const names = Object.keys(folders);
  const open = folders[current] ? current : DEFAULT_FOLDER;
  const total = Object.values(folders).reduce((n, ids) => n + ids.length, 0);
  // Folders keep the newest save first.
  const items = (folders[open] ?? [])
    .map((id) => storyById(id))
    .filter((s): s is Story => !!s);
  const recentStories = recent
    .slice(0, 5)
    .map((id) => storyById(id))
    .filter((s): s is Story => !!s);

  const columns = Math.max(1, Math.floor((gridWidth + GRID_GAP) / (TILE_MIN + GRID_GAP)));
  const tileWidth = gridWidth ? (gridWidth - GRID_GAP * (columns - 1)) / columns : TILE_MIN;

  const folderOn = downloadedFolders.includes(open);
  const downloadFolder = () =>
    toast.show(toggleFolderDownload(open) ? `${open} will stay downloaded` : `Downloads removed from ${open}`);

  const signedIn = status === 'signedIn';

  return (
    <WidePage>
      <View style={[styles.header, { borderBottomColor: colors.ink }]}>
        <Text variant="display" accessibilityRole="header" style={{ fontSize: 48, lineHeight: 52, letterSpacing: -0.6 }}>
          Library
        </Text>
        {signedIn ? (
          <Text variant="label" color="muted">
            {names.length} {names.length === 1 ? 'folder' : 'folders'} · {total} {total === 1 ? 'article' : 'articles'} ·{' '}
            {downloaded.length} downloaded
          </Text>
        ) : null}
      </View>

      {!signedIn ? (
        <View style={[styles.prompt, { borderColor: colors.rule, backgroundColor: colors.surface }]}>
          <Text variant="headline">Sign in to keep a library.</Text>
          <Text variant="ui" color="muted">
            Saved stories and folders need an account so they follow you to every device. You can keep reading without one.
          </Text>
          <View style={{ width: 200 }}>
            <Button label="Sign in" onPress={() => router.push('/sign-in')} />
          </View>
        </View>
      ) : (
        <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
          {names.map((name) => {
            const ids = folders[name];
            const on = name === open;
            const n = ids.filter((id) => downloaded.includes(id)).length;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${name}, ${ids.length} articles`}
                onPress={() => setCurrent(name)}
                style={{ width: tileWidth, gap: 10 }}>
                <FolderStack on={on} />
                <View style={styles.tileText}>
                  <Text variant="headline" medium={on} style={{ fontSize: 19, lineHeight: 24, flexShrink: 1 }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text variant="meta" color="muted">
                    {ids.length}
                    {n ? ` · ${n} downloaded` : ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            onPress={onNewFolder}
            style={[styles.newFolder, { width: tileWidth, borderColor: colors.muted }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.6} strokeLinecap="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
            <Text variant="ui" color="muted" style={{ fontSize: 14 }}>
              New folder
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.lower}>
        {signedIn ? (
          <View style={{ flexGrow: 999, flexShrink: 1, flexBasis: 560, minWidth: 0 }}>
            <View style={[styles.folderHead, { borderBottomColor: colors.ink }]}>
              <Text variant="headline" style={{ fontSize: 28, lineHeight: 32, flexShrink: 1 }} numberOfLines={1}>
                {open}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {items.length || folderOn ? (
                  <Pressable accessibilityRole="button" onPress={downloadFolder} style={styles.headAction}>
                    <Text variant="meta" color="accent" medium style={{ fontSize: 13 }}>
                      {folderOn ? 'Remove downloads' : 'Download'}
                    </Text>
                  </Pressable>
                ) : null}
                <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
                  Newest saved first
                </Text>
              </View>
            </View>
            {items.length === 0 ? (
              <View style={{ paddingVertical: 32, gap: 8 }}>
                <Text variant="headline">Nothing saved here yet.</Text>
                <Text variant="body" color="muted">
                  {open === DEFAULT_FOLDER
                    ? 'Click Save on any story and it lands here. You can move it to another folder from the toast.'
                    : 'Save a story, then pick Change folder in the toast to move it here.'}
                </Text>
              </View>
            ) : (
              items.map((s) => <LibraryRow key={s.id} story={s} downloaded={downloaded.includes(s.id)} />)
            )}
          </View>
        ) : null}

        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 260, minWidth: 0, gap: 8 }}>
          {signedIn && hint ? <SyncHint onDismiss={dismissHint} /> : null}
          {recentStories.length ? (
            <View>
              <SectionHeader title="Recently viewed" moreLabel="See all" onMore={() => router.push('/history')} />
              {recentStories.map((s) => (
                <StoryRow key={s.id} story={s} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </WidePage>
  );
}

/** Three offset sheets, like papers in a tray. The open folder gets an ink edge. */
function FolderStack({ on }: { on: boolean }) {
  const { colors, name } = useTheme();
  const back = name === 'ink' ? '#25221E' : '#E6DDCE';
  return (
    <View style={{ height: 128 }}>
      <View style={[styles.sheet, { left: 18, right: 0, top: 0, backgroundColor: back, borderColor: colors.rule }]} />
      <View style={[styles.sheet, { left: 9, right: 9, top: 11, backgroundColor: colors.photo, borderColor: colors.rule }]} />
      <View
        style={[
          styles.sheet,
          { left: 0, right: 18, top: 22, backgroundColor: colors.surface, borderColor: on ? colors.ink : colors.rule, borderWidth: on ? 1.5 : 1 },
        ]}
      />
    </View>
  );
}

function LibraryRow({ story, downloaded }: { story: Story; downloaded: boolean }) {
  const { colors } = useTheme();
  const open = useOpenStory();
  const lang = story.lang !== 'en' ? story.lang : undefined;
  return (
    <View style={[styles.row, { borderBottomColor: colors.rule }]}>
      <Pressable {...storyLink} accessibilityRole="link" onPress={() => open(story.id)} style={{ flex: 1, gap: 6 }}>
        <Text variant="headline" lang={lang} style={{ fontSize: 21, lineHeight: 26 }}>
          {story.headline}
        </Text>
        <Text variant="meta" color="muted">
          {sourceById(story.sourceId).name} · {ago(story.minsAgo)}
          {downloaded ? ' · Downloaded' : ''}
        </Text>
      </Pressable>
      <SaveButton story={story} size={18} />
      <MoreButton story={story} />
    </View>
  );
}

/** First visit on a browser (WebSyncHint): what syncs and what stays on this device. */
function SyncHint({ onDismiss }: { onDismiss: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View accessibilityLabel="About your library" style={[styles.hint, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
      <Text variant="label" color="muted">
        On this browser
      </Text>
      <Text variant="body" style={{ lineHeight: 25 }}>
        Your library is the same on every device you sign in to. Downloads stay on the device you download them on.
      </Text>
      <View style={styles.hintActions}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/you')} style={{ height: 44, justifyContent: 'center' }}>
          <Text variant="ui" style={{ fontSize: 14, textDecorationLine: 'underline' }}>
            Storage settings
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDismiss} style={[styles.gotIt, { borderColor: colors.ink }]}>
          <Text variant="ui" medium style={{ fontSize: 14 }}>
            Got it
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: 24,
    rowGap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  prompt: { marginTop: 32, padding: 24, gap: 12, borderWidth: 1, maxWidth: 560 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginTop: 32 },
  tileText: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 },
  sheet: { position: 'absolute', height: 104, borderWidth: 1 },
  newFolder: { height: 128, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  lower: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', columnGap: 56, rowGap: 32, marginTop: 32 },
  folderHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headAction: { minHeight: 32, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingVertical: 16, borderBottomWidth: 1 },
  hint: { gap: 12, borderWidth: 1, paddingVertical: 18, paddingHorizontal: 20 },
  hintActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  gotIt: { height: 40, paddingHorizontal: 16, borderWidth: 1, justifyContent: 'center' },
});
