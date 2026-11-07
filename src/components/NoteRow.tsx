import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Note } from '../types';
import { colors } from '../theme';
import { formatListDate, getDisplay } from '../utils';

type Props = {
  note: Note;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
};

function NoteRow({ note, isFirst, isLast, onPress }: Props) {
  const { title, preview } = getDisplay(note);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.first,
        isLast && styles.last,
        pressed && { backgroundColor: colors.pressed },
      ]}
    >
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.date}>{formatListDate(note.updatedAt)}</Text>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      {!isLast && <View style={styles.separator} />}
    </Pressable>
  );
}

export default React.memo(NoteRow);

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  first: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  last: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  meta: { flexDirection: 'row', marginTop: 3 },
  date: { fontSize: 15, color: colors.text, marginRight: 8 },
  preview: { flex: 1, fontSize: 15, color: colors.secondary },
  separator: {
    position: 'absolute',
    left: 16,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
});
