import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export default function SearchBar({ value, onChangeText }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const showCancel = focused || value.length > 0;

  const cancel = () => {
    onChangeText('');
    (inputRef.current as any)?.blur();
  };

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Ionicons name="search" size={18} color={colors.secondary} />
        <TextInput
          ref={inputRef as any}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search"
          placeholderTextColor={colors.secondary}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search notes"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.secondary} />
          </Pressable>
        )}
      </View>
      {showCancel && (
        <Pressable onPress={cancel} hitSlop={8} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECE8DD',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
  },
  input: { flex: 1, marginLeft: 6, fontSize: 17, color: colors.text, paddingVertical: 0 },
  cancel: { marginLeft: 12 },
  cancelText: { fontSize: 17, color: colors.accent },
});

