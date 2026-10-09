import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { FolderIcon } from '@/components/icons';
import { Sheet } from '@/components/sheet';
import { StoryRow } from '@/components/story';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Screen, SectionHeader } from '@/components/ui';
import { WideLibrary } from '@/components/wide/library';
import { Fonts, TouchTarget } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { storyById } from '@/data/sample';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

export default function Library() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { status } = useSession();
  const { folders, downloaded, recent, createFolder } = useReader();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const wide = useLayout() !== 'phone';

  const total = Object.values(folders).reduce((n, ids) => n + ids.length, 0);
  const recentStories = recent
    .slice(0, 5)
    .map((id) => storyById(id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  const newFolderSheet = (
    <Sheet visible={creating} title="New folder" onClose={() => setCreating(false)}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Folder name"
        placeholderTextColor={colors.muted}
        autoFocus
        maxLength={40}
        style={[styles.input, { borderColor: colors.ink, color: colors.ink, backgroundColor: colors.bg }]}
      />
      <View style={{ height: 12 }} />
      <Button
        label="Create folder"
        disabled={!name.trim()}
        onPress={() => {
          if (createFolder(name)) {
            toast.show(`Created ${name.trim()}`);
            setName('');
            setCreating(false);
          } else {
            toast.show('You already have a folder with that name.');
          }
        }}
      />
    </Sheet>
  );

  if (wide) {
    return (
      <>
        <WideLibrary onNewFolder={() => setCreating(true)} />
        {newFolderSheet}
      </>
    );
  }

  return (
    <Screen maxWidth={720}>
      <Text variant="display">Library</Text>

      {status !== 'signedIn' ? (
        <View style={[styles.prompt, { borderColor: colors.rule, backgroundColor: colors.surface }]}>
          <Text variant="headline">Sign in to keep a library.</Text>
          <Text variant="ui" color="muted">
            Saved stories and folders need an account so they follow you to every device. You can keep reading without one.
          </Text>
          <Button label="Sign in" onPress={() => router.push('/sign-in')} />
        </View>
      ) : (
        <>
          <Text variant="meta" color="muted" style={{ marginTop: 4 }}>
            {Object.keys(folders).length} {Object.keys(folders).length === 1 ? 'folder' : 'folders'} · {total}{' '}
            {total === 1 ? 'article' : 'articles'} · {downloaded.length} downloaded
          </Text>

          <View style={{ marginTop: 16 }}>
            {Object.keys(folders).map((folder) => {
              const ids = folders[folder];
              const offline = ids.filter((id) => downloaded.includes(id)).length;
              return (
                <Pressable
                  key={folder}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/folder/[name]', params: { name: folder } })}
                  style={[styles.folder, { borderBottomColor: colors.rule }]}>
                  <FolderIcon size={24} color={colors.ink} />
                  <View style={{ flex: 1 }}>
                    <Text variant="headline" style={{ fontSize: 20 }}>
                      {folder}
                    </Text>
                    <Text variant="meta" color="muted">
                      {ids.length} {ids.length === 1 ? 'article' : 'articles'}
                      {offline ? ` · ${offline} downloaded` : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable accessibilityRole="button" onPress={() => setCreating(true)} style={styles.newFolder}>
              <Text variant="ui" medium color="accent">
                + New folder
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {recentStories.length ? (
        <View>
          <SectionHeader title="Recently viewed" moreLabel="See all" onMore={() => router.push('/history')} />
          {recentStories.map((s) => (
            <StoryRow key={s.id} story={s} />
          ))}
        </View>
      ) : null}

      {newFolderSheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  prompt: { marginTop: 20, padding: 20, gap: 12, borderWidth: StyleSheet.hairlineWidth },
  folder: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  newFolder: { minHeight: TouchTarget, justifyContent: 'center', marginTop: 4 },
  input: { height: 52, borderWidth: 1, paddingHorizontal: 14, fontFamily: Fonts.sans, fontSize: 16 },
});
