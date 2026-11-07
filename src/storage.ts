import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from './types';

const STORAGE_KEY = '@notes-app/notes/v1';

function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false;
  const n = value as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.body === 'string' &&
    typeof n.createdAt === 'number' &&
    typeof n.updatedAt === 'number'
  );
}

/** Throws if storage can't be read or the stored data is unreadable. */
export async function loadNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return []; // first launch
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Stored notes have an unexpected format');
  return parsed.filter(isNote);
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
