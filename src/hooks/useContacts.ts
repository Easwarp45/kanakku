import { useState, useCallback } from 'react';

export interface ContactEntry {
  name: string;
  phones: string[];
}

interface UseContactsResult {
  isSupported: boolean;
  isFetching: boolean;
  contacts: ContactEntry[];
  fetchContacts: () => Promise<ContactEntry[]>;
}

/**
 * Lightweight wrapper around the Web Contacts Picker API (if available).
 * Falls back to an empty list when not supported. Contact data stays on-device.
 */
export function useContacts(): UseContactsResult {
  const isSupported = typeof navigator !== 'undefined' && !!(navigator as any).contacts && !!(navigator as any).contacts.select;
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!isSupported) return [] as ContactEntry[];

    try {
      setIsFetching(true);
      const picker = (navigator as any).contacts;
      const result = await picker.select(['name', 'tel'], { multiple: true });

      const mapped: ContactEntry[] = (result || []).map((c: any) => ({
        name: Array.isArray(c.name) ? c.name[0] || '' : c.name || '',
        phones: Array.isArray(c.tel) ? c.tel.filter(Boolean) : c.tel ? [c.tel] : [],
      })).filter((c: ContactEntry) => c.name || c.phones.length > 0);

      setContacts(mapped);
      return mapped;
    } catch (err) {
      console.warn('Contact picker failed or was denied:', err);
      return [] as ContactEntry[];
    } finally {
      setIsFetching(false);
    }
  }, [isSupported]);

  return { isSupported, isFetching, contacts, fetchContacts };
}
