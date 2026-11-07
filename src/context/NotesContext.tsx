import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Note } from '../types';
import { loadNotes, saveNotes } from '../storage';
import { sortNotes } from '../utils';

type Status = 'loading' | 'ready' | 'error';

type NotesContextValue = {
  notes: Note[];
  status: Status;
  error: string | null;
  getNote: (id: string) => Note | undefined;
  saveNote: (id: string, title: string, body: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  dismissError: () => void;
};

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  // Always holds the newest list, so back-to-back saves never use stale data.
  const notesRef = useRef<Note[]>([]);
  const readyRef = useRef(false);
  // Writes to storage run one after another so they can't finish out of order.
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const loaded = sortNotes(await loadNotes());
      notesRef.current = loaded;
      setNotes(loaded);
      readyRef.current = true;
      setStatus('ready');
    } catch {
      readyRef.current = false;
      setError('We couldn’t load your notes. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const persist = useCallback((next: Note[]): Promise<void> => {
    const sorted = sortNotes(next);
    notesRef.current = sorted;
    setNotes(sorted);
    writeQueue.current = writeQueue.current.then(async () => {
      try {
        await saveNotes(sorted);
        setError(null);
      } catch {
        setError('We couldn’t save your changes. Your latest edits may be lost if you close the app.');
      }
    });
    return writeQueue.current;
  }, []);

  const saveNote = useCallback(
    async (id: string, title: string, body: string) => {
      // Never write before the saved notes were loaded: that could overwrite them.
      if (!readyRef.current) return;

      const current = notesRef.current;
      const existing = current.find((n) => n.id === id);
      const isEmpty = !title.trim() && !body.trim();

      if (isEmpty) {
        // Like Apple Notes: a note left completely empty is removed.
        if (existing) await persist(current.filter((n) => n.id !== id));
        return;
      }
      if (existing && existing.title === title && existing.body === body) return; // nothing changed

      const now = Date.now();
      if (existing) {
        await persist(current.map((n) => (n.id === id ? { ...n, title, body, updatedAt: now } : n)));
      } else {
        await persist([{ id, title, body, createdAt: now, updatedAt: now }, ...current]);
      }
    },
    [persist]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!readyRef.current) return;
      const current = notesRef.current;
      if (!current.some((n) => n.id === id)) return;
      await persist(current.filter((n) => n.id !== id));
    },
    [persist]
  );

  const getNote = useCallback((id: string) => notes.find((n) => n.id === id), [notes]);
  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ notes, status, error, getNote, saveNote, deleteNote, reload, dismissError }),
    [notes, status, error, getNote, saveNote, deleteNote, reload, dismissError]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside <NotesProvider>');
  return ctx;
}
