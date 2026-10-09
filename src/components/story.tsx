import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { BookmarkIcon, MoreIcon } from '@/components/icons';
import { Sheet, SheetRow } from '@/components/sheet';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Photo } from '@/components/ui';
import { TouchTarget } from '@/constants/theme';
import { ago, sourceById, type Story } from '@/data/sample';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

export const SITE_URL = 'https://unedited-six.vercel.app';

export function useOpenStory() {
  const router = useRouter();
  return (id: string) => router.push({ pathname: '/article/[id]', params: { id } });
}

/**
 * Save is its own icon (never inside the ⋯ menu). One tap saves to "Saved" with a toast;
 * tapping a filled bookmark removes it. Guests get a sign-in prompt instead. Saving never downloads
 * (unless "Auto-download saved articles" is on).
 */
export function SaveButton({ story, size = 22 }: { story: Story; size?: number }) {
  const { colors } = useTheme();
  const { status } = useSession();
  const { isSaved, toggleSaved, moveToFolder, folders } = useReader();
  const toast = useToast();
  const router = useRouter();
  const [guestPrompt, setGuestPrompt] = useState(false);
  const [picker, setPicker] = useState(false);
  const saved = isSaved(story.id);

  const press = () => {
    if (status !== 'signedIn') return setGuestPrompt(true);
    const result = toggleSaved(story.id);
    if (result === 'saved') toast.show('Saved', { label: 'Change folder', run: () => setPicker(true) });
    else toast.show('Removed from Saved', { label: 'Undo', run: () => toggleSaved(story.id) });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Remove from Saved' : 'Save'}
        accessibilityState={{ selected: saved }}
        onPress={press}
        hitSlop={4}
        style={styles.icon}>
        <BookmarkIcon size={size} color={saved ? colors.accent : colors.muted} filled={saved} />
      </Pressable>

      <Sheet visible={guestPrompt} title="Save stories" onClose={() => setGuestPrompt(false)}>
        <Text variant="headline" style={{ marginBottom: 8 }}>
          Sign in to save this story.
        </Text>
        <Text variant="ui" color="muted" style={{ marginBottom: 16 }}>
          You can read without an account. Saving and folders need one, so they follow you to every device.
        </Text>
        <SheetRow
          label="Sign in"
          onPress={() => {
            setGuestPrompt(false);
            router.push('/sign-in');
          }}
        />
        <SheetRow label="Not now" onPress={() => setGuestPrompt(false)} />
      </Sheet>

      <Sheet visible={picker} title="Save to" onClose={() => setPicker(false)}>
        {Object.keys(folders).map((name) => (
          <SheetRow
            key={name}
            label={name}
            hint={`${folders[name].length} stories`}
            onPress={() => {
              moveToFolder(story.id, name);
              setPicker(false);
              toast.show(`Saved to ${name}`);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

/** ⋯ menu: Download · Share link · More about [topic] · Not interested · Report a problem. */
export function MoreButton({ story, vertical, onImage }: { story: Story; vertical?: boolean; onImage?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { downloaded, toggleDownload, hide } = useReader();
  const [open, setOpen] = useState(false);
  const isDownloaded = downloaded.includes(story.id);

  const close = () => setOpen(false);

  const share = async () => {
    close();
    const url = `${SITE_URL}/article/${story.id}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.share) {
        await navigator.clipboard?.writeText(url);
        toast.show('Link copied');
      } else if (Platform.OS === 'web') {
        await navigator.share({ title: story.headline, url });
      } else {
        await Share.share({ message: `${story.headline}\n${url}` });
      }
    } catch {
      // Reader cancelled the share sheet.
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More options"
        onPress={() => setOpen(true)}
        hitSlop={4}
        style={[styles.icon, onImage && { backgroundColor: colors.surface, borderRadius: TouchTarget / 2 }]}>
        <MoreIcon size={22} color={onImage ? colors.ink : colors.muted} vertical={vertical} />
      </Pressable>
      <Sheet visible={open} onClose={close}>
        <SheetRow
          label={isDownloaded ? 'Remove download' : 'Download'}
          hint={isDownloaded ? undefined : 'Keep a copy on this device'}
          onPress={() => {
            toggleDownload(story.id);
            close();
            toast.show(isDownloaded ? 'Download removed' : 'Downloaded');
          }}
        />
        <SheetRow label="Share link" onPress={share} />
        <SheetRow
          label={`More about ${story.topic}`}
          onPress={() => {
            close();
            router.push({ pathname: '/search', params: { q: story.topic } });
          }}
        />
        <SheetRow
          label="Not interested"
          onPress={() => {
            hide(story.id);
            close();
            toast.show('Hidden from your front page');
          }}
        />
        <SheetRow
          label="Report a problem"
          onPress={() => {
            close();
            toast.show("Reporting isn't connected yet.");
          }}
        />
      </Sheet>
    </>
  );
}

/** Source, time and the Save + ⋯ pair. */
export function Byline({ story, showSource = true }: { story: Story; showSource?: boolean }) {
  const source = sourceById(story.sourceId);
  return (
    <View style={styles.byline}>
      <Text variant="meta" color="muted" style={{ flex: 1 }} numberOfLines={1} lang={story.lang !== 'en' ? story.lang : undefined}>
        {showSource ? `${source.name} · ` : ''}
        {ago(story.minsAgo)}
      </Text>
      <SaveButton story={story} size={20} />
      <MoreButton story={story} />
    </View>
  );
}

/** Headline-first row. `thumb` adds a small photo (Comfortable home view). */
export function StoryRow({ story, thumb, number }: { story: Story; thumb?: boolean; number?: number }) {
  const { colors } = useTheme();
  const open = useOpenStory();
  return (
    <View style={[styles.row, { borderBottomColor: colors.rule }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={story.headline}
        onPress={() => open(story.id)}
        style={styles.rowMain}>
        {number ? (
          <Text variant="headline" color="accent" style={styles.number}>
            {number}
          </Text>
        ) : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="headline" lang={story.lang !== 'en' ? story.lang : undefined} style={{ fontSize: 19, lineHeight: 24 }}>
            {story.headline}
          </Text>
        </View>
        {thumb ? <Photo height={64} style={{ width: 84 }} /> : null}
      </Pressable>
      <Byline story={story} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  byline: { flexDirection: 'row', alignItems: 'center' },
  row: { paddingTop: 14, paddingBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  number: { width: 22, paddingTop: 1 },
});
