import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AppState, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation';
import { useNotes } from '../context/NotesContext';
import { colors } from '../theme';
import { createId, formatFullDate } from '../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

const AUTOSAVE_DELAY_MS = 400;

export default function EditorScreen({ navigation, route }: Props) {
  const { getNote, saveNote, deleteNote } = useNotes();

  const existingId = route.params?.noteId;
  const idRef = useRef<string>(existingId ?? createId());
  const noteId = idRef.current;
  const savedNote = getNote(noteId);

  const [title, setTitle] = useState(savedNote?.title ?? '');
  const [body, setBody] = useState(savedNote?.body ?? '');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Latest text lives in a ref so the save function never reads stale values.
  const latest = useRef({ title, body });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleted = useRef(false);
  const bodyRef = useRef<any>(null);
  const saveRef = useRef(saveNote);
  saveRef.current = saveNote;

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (deleted.current) return;
    void saveRef.current(noteId, latest.current.title, latest.current.body);
  }, [noteId]);

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
  }, [flush]);

  const onChangeTitle = (text: string) => {
    setTitle(text);
    latest.current.title = text;
    scheduleSave();
  };
  const onChangeBody = (text: string) => {
    setBody(text);
    latest.current.body = text;
    scheduleSave();
  };

  // Save immediately when leaving the screen (back button or swipe) ...
  useEffect(() => () => flush(), [flush]);

  // ... and when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete this note?', 'This note will be permanently deleted. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleted.current = true;
          if (timer.current) clearTimeout(timer.current);
          void deleteNote(noteId);
          navigation.goBack();
        },
      },
    ]);
  }, [deleteNote, navigation, noteId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        keyboardVisible ? (
          <Pressable onPress={() => Keyboard.dismiss()} hitSlop={10} accessibilityRole="button">
            <Text style={styles.done}>Done</Text>
          </Pressable>
        ) : (
          <Pressable onPress={confirmDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete note">
            <Ionicons name="trash-outline" size={24} color={colors.accent} />
          </Pressable>
        ),
    });
  }, [navigation, keyboardVisible, confirmDelete]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.date}>{formatFullDate(savedNote?.updatedAt ?? Date.now())}</Text>

      <TextInput
        style={styles.title}
        value={title}
        onChangeText={onChangeTitle}
        placeholder="Title"
        placeholderTextColor={colors.secondary}
        autoFocus={!existingId}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => bodyRef.current?.focus()}
        accessibilityLabel="Note title"
      />
      <TextInput
        ref={bodyRef}
        style={styles.body}
        value={body}
        onChangeText={onChangeBody}
        placeholder="Start writing…"
        placeholderTextColor={colors.secondary}
        multiline
        scrollEnabled={false}
        textAlignVertical="top"
        accessibilityLabel="Note body"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  date: { textAlign: 'center', fontSize: 13, color: colors.secondary, marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, paddingVertical: 4 },
  body: { fontSize: 17, lineHeight: 24, color: colors.text, minHeight: 320, marginTop: 8, paddingTop: 0 },
  done: { fontSize: 17, fontWeight: '600', color: colors.accent },
});
