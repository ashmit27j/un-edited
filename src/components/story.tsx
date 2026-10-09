import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { BackIcon, BookmarkIcon, MoreIcon } from '@/components/icons';
import { Sheet, SheetRow } from '@/components/sheet';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Photo } from '@/components/ui';
import { Fonts, TouchTarget } from '@/constants/theme';
import { REASONS, sendReport, type ReportReason } from '@/lib/reports';
import { useColourCues, useTarget } from '@/hooks/use-a11y';
import { ago, type Story } from '@/data/sample';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';
import { useNews } from '@/data/news';

export const SITE_URL = 'https://unedited-six.vercel.app';

/**
 * Spread on anything that opens a story. On desktop web it gets the "Read more" stamp cursor
 * ([data-story-link] in +html.tsx); elsewhere it does nothing.
 */
export const storyLink = (Platform.OS === 'web' ? { dataSet: { storyLink: '' } } : {}) as object;

export function useOpenStory() {
  const router = useRouter();
  return (id: string) => router.push({ pathname: '/article/[id]', params: { id } });
}

/**
 * Save is its own icon (never inside the ⋯ menu). One tap saves to "Saved" with a toast;
 * tapping a filled bookmark removes it. Guests get a sign-in prompt instead. Saving never downloads
 * (unless "Auto-download saved articles" is on).
 */
export function SaveButton({ story, size = 22, withText }: { story: Story; size?: number; withText?: boolean }) {
  const { colors } = useTheme();
  const { status } = useSession();
  const { isSaved, toggleSaved, moveToFolder, folders } = useReader();
  const toast = useToast();
  const router = useRouter();
  const [guestPrompt, setGuestPrompt] = useState(false);
  const [picker, setPicker] = useState(false);
  const saved = isSaved(story.id);
  const target = useTarget();
  const t = useT();
  // Without colour cues, Saved is a filled accent bookmark; with them it also says "Saved".
  const cues = useColourCues();
  const label = withText || (cues && saved);

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
        style={[label ? styles.textButton : styles.icon, { minWidth: target, height: target }]}>
        <BookmarkIcon size={size} color={saved ? colors.accent : withText ? colors.ink : colors.muted} filled={saved} />
        {label ? (
          <Text variant="ui" medium style={{ fontSize: 14, color: saved ? colors.accent : colors.ink }}>
            {saved ? t('story.saved') : t('story.save')}
          </Text>
        ) : null}
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
  const [panel, setPanel] = useState<'menu' | 'report' | 'sent'>('menu');
  const isDownloaded = downloaded.includes(story.id);
  const target = useTarget();
  const t = useT();

  const close = () => {
    setOpen(false);
    setPanel('menu');
  };

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
        style={[styles.icon, { width: target, height: target }, onImage && { backgroundColor: colors.surface, borderRadius: target / 2 }]}>
        <MoreIcon size={22} color={onImage ? colors.ink : colors.muted} vertical={vertical} />
      </Pressable>
      <Sheet visible={open} onClose={close}>
        {panel !== 'menu' ? (
          <ReportPanel story={story} sent={panel === 'sent'} onBack={() => setPanel('menu')} onSent={() => setPanel('sent')} onDone={close} />
        ) : (
          <>
        <SheetRow
          label={isDownloaded ? 'Remove download' : 'Download'}
          hint={isDownloaded ? undefined : 'Keep a copy on this device'}
          onPress={() => {
            toggleDownload(story.id);
            close();
            toast.show(isDownloaded ? 'Download removed' : 'Downloaded');
          }}
        />
        <SheetRow label={t('story.share')} onPress={share} />
        <SheetRow
          label={`More about ${story.topic}`}
          onPress={() => {
            close();
            router.push({ pathname: '/search', params: { q: story.topic } });
          }}
        />
        <SheetRow
          label={t('story.notInterested')}
          onPress={() => {
            hide(story.id);
            close();
            toast.show('Hidden from your front page');
          }}
        />
        <SheetRow label={t('story.report')} danger onPress={() => setPanel('report')} />
          </>
        )}
      </Sheet>
    </>
  );
}

/** Report a problem (MoreSheet board, panel = report / sent): what's wrong, optional details, send. */
function ReportPanel({
  story,
  sent,
  onBack,
  onSent,
  onDone,
}: {
  story: Story;
  sent: boolean;
  onBack: () => void;
  onSent: () => void;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picked = REASONS.find((r) => r.id === reason);

  if (sent)
    return (
      <View accessibilityRole="alert" style={{ paddingTop: 22, paddingBottom: 4, gap: 12 }}>
        <Text variant="label" color="accent">
          Report sent · {picked?.label}
        </Text>
        <Text variant="headline" medium style={{ fontSize: 22, lineHeight: 27.5 }}>
          Thank you. We’ll check it against the publisher’s original.
        </Text>
        <Text variant="ui" color="muted" style={{ fontSize: 14, lineHeight: 21.5 }}>
          If it’s our mistake, we’ll fix it for everyone. We never change the publisher’s words.
        </Text>
        <Button label="Done" kind="secondary" onPress={onDone} />
      </View>
    );

  const send = async () => {
    if (!reason) return;
    setBusy(true);
    setError(null);
    const failed = await sendReport({ storyId: story.id, sourceId: story.sourceId, reason, details });
    setBusy(false);
    if (failed) setError(failed);
    else onSent();
  };

  return (
    <View accessibilityLabel="Report a problem" style={{ paddingTop: 6, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to options" onPress={onBack} style={styles.icon}>
          <BackIcon size={20} color={colors.ink} />
        </Pressable>
        <Text variant="headline" medium style={{ fontSize: 22, lineHeight: 27 }}>
          Report a problem
        </Text>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel="What's wrong?">
        <Text variant="label" color="muted" style={{ paddingBottom: 4 }}>
          What’s wrong?
        </Text>
        {REASONS.map((r) => {
          const on = r.id === reason;
          return (
            <Pressable
              key={r.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setReason(r.id)}
              style={[styles.reason, { borderBottomColor: colors.rule }]}>
              <View style={[styles.radio, { borderColor: on ? colors.accent : colors.muted }]}>
                {on ? <View style={[styles.radioDot, { backgroundColor: colors.accent }]} /> : null}
              </View>
              <Text variant="ui">{r.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ gap: 6 }}>
        <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
          Add details (optional)
        </Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={3}
          maxLength={1000}
          placeholder={picked?.hint ?? ''}
          placeholderTextColor={colors.muted}
          accessibilityLabel="Add details (optional)"
          style={[styles.details, { borderColor: colors.rule, backgroundColor: colors.bg, color: colors.ink }]}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Button label="Send report" disabled={!reason} busy={busy} onPress={send} />
        <Text variant="meta" color={error ? 'accent' : 'muted'} style={{ fontSize: 12, lineHeight: 18 }} accessibilityLiveRegion="polite">
          {error ?? (reason ? 'Your report includes this story and its source. No account details are sent.' : 'Pick what’s wrong to send the report.')}
        </Text>
      </View>
    </View>
  );
}

/** Source, time and the Save + ⋯ pair. */
export function Byline({ story, showSource = true }: { story: Story; showSource?: boolean }) {
  const { sourceById } = useNews();
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
        {...storyLink}
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
        {thumb ? <Photo uri={story.imageUrl} height={64} style={{ width: 84 }} /> : null}
      </Pressable>
      <Byline story={story} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  reason: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  details: { minHeight: 76, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  textButton: { height: TouchTarget, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  byline: { flexDirection: 'row', alignItems: 'center' },
  row: { paddingTop: 14, paddingBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  number: { width: 22, paddingTop: 1 },
});
