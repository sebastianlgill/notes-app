import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation';
import { useNotes } from '../context/NotesContext';
import { Note } from '../types';
import { colors } from '../theme';
import { matchesQuery, noteCountLabel } from '../utils';
import SearchBar from '../components/SearchBar';
import NoteRow from '../components/NoteRow';
import EmptyState from '../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { notes, status, error, reload, dismissError } = useNotes();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const results = useMemo(() => notes.filter((n) => matchesQuery(n, query)), [notes, query]);
  const isSearching = query.trim().length > 0;

  const openNote = useCallback(
    (id: string) => {
      Keyboard.dismiss();
      navigation.navigate('Editor', { noteId: id });
    },
    [navigation]
  );

  const compose = () => {
    Keyboard.dismiss();
    navigation.navigate('Editor', {});
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Note; index: number }) => (
      <NoteRow
        note={item}
        isFirst={index === 0}
        isLast={index === results.length - 1}
        onPress={() => openNote(item.id)}
      />
    ),
    [results.length, openNote]
  );

  let content: React.ReactNode;
  if (status === 'loading') {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  } else if (status === 'error') {
    content = (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorTitle}>Notes unavailable</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retry} onPress={() => void reload()}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <FlatList
        data={results}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isSearching ? (
            <EmptyState icon="search-outline" title="No Results" message={`No notes match “${query.trim()}”.`} />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="No Notes"
              message="Tap the compose button below to write your first note."
            />
          )
        }
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.heading}>Notes</Text>
      {status === 'ready' && <SearchBar value={query} onChangeText={setQuery} />}

      {status === 'ready' && error && (
        <Pressable style={styles.banner} onPress={dismissError}>
          <Text style={styles.bannerText}>{error} (tap to dismiss)</Text>
        </Pressable>
      )}

      <View style={styles.flex}>{content}</View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.sideSpacer} />
        <Text style={styles.count}>{status === 'ready' ? noteCountLabel(notes.length) : ''}</Text>
        <View style={styles.sideSpacer}>
          <Pressable
            onPress={compose}
            disabled={status !== 'ready'}
            accessibilityRole="button"
            accessibilityLabel="New note"
            style={({ pressed }) => [
              styles.compose,
              status !== 'ready' && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="create-outline" size={24} color={colors.onAccent} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  heading: { fontSize: 34, fontWeight: '800', color: colors.text, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  listContent: { flexGrow: 1, paddingBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  errorMessage: { fontSize: 16, color: colors.secondary, textAlign: 'center', marginTop: 6 },
  retry: { marginTop: 18, backgroundColor: colors.accentFill, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  retryText: { fontSize: 17, fontWeight: '600', color: colors.onAccent },
  banner: { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 10, backgroundColor: '#FDECEA' },
  bannerText: { color: colors.danger, fontSize: 14 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  sideSpacer: { width: 56, alignItems: 'flex-end' },
  count: { flex: 1, textAlign: 'center', fontSize: 13, color: colors.secondary },
  compose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
