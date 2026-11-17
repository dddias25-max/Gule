import { ConferenceSheet, createEmptySheet } from './carcassMath';

const DRAFT_STORAGE_KEY = 'carcass_conference_draft_v1';
const HISTORY_STORAGE_KEY = 'carcass_conference_history_v1';

export function loadDraftSheet(): ConferenceSheet {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createEmptySheet();
    const parsed = JSON.parse(raw) as ConferenceSheet;
    if (
      parsed &&
      Array.isArray(parsed.traseiro) &&
      Array.isArray(parsed.dianteiro)
    ) {
      return parsed;
    }
  } catch {
    // Fallback to clean empty sheet if storage is corrupted
  }
  return createEmptySheet();
}

export function saveDraftSheet(sheet: ConferenceSheet): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(sheet));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadHistorySheets(): ConferenceSheet[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore parse error
  }
  return [];
}

export function saveHistorySheets(sheets: ConferenceSheet[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sheets));
  } catch {
    // Ignore storage quota errors
  }
}
