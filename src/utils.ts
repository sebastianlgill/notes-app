import { Note } from './types';

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const EMPTY_PREVIEW = 'No additional text';

/** What to show in the list: title (or first line of body if no title) + preview text. */
export function getDisplay(note: Note): { title: string; preview: string } {
  const title = note.title.trim();
  const lines = note.body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (title) return { title, preview: lines.join(' ') || EMPTY_PREVIEW };
  if (lines.length > 0) return { title: lines[0], preview: lines.slice(1).join(' ') || EMPTY_PREVIEW };
  return { title: 'New Note', preview: EMPTY_PREVIEW };
}

/** Case-insensitive match against title and body. Empty query matches everything. */
export function matchesQuery(note: Note, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q);
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Short date for the list: time today, "Yesterday", weekday this week, else a numeric date. */
export function formatListDate(timestamp: number, now: Date = new Date()): string {
  const date = new Date(timestamp);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (dayDiff <= 0) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

/** Long date shown at the top of the editor. */
export function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function noteCountLabel(count: number): string {
  return count === 1 ? '1 Note' : `${count} Notes`;
}
