// Saving and restoring a draft in this browser (localStorage).
// Every read and write is guarded: private windows, blocked storage or a damaged saved value
// must never break the page or lose what the manager has typed.

const KEY = 'support-capacity-proposal:draft';
const FIELDS = ['triage', 'exceptions', 'knowledge'];

const browserStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

/**
 * Save the entries exactly as typed, plus the reason text.
 * Returns true if it was stored, false if the browser refused.
 */
export function saveDraft({ entries, rationale }, storage = browserStorage()) {
  if (!storage) return false;
  try {
    const draft = { version: 1, entries: { ...entries }, rationale, savedAt: new Date().toISOString() };
    storage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/**
 * A save function for the page to use. With failFirstSave (the ?save=error demo), the first
 * attempt fails on purpose without touching storage; every attempt after that saves normally.
 * It only reads the draft it's given, so a failure can never change or lose the entries.
 */
export function createSaver({ failFirstSave = false } = {}, save = saveDraft) {
  let failNext = failFirstSave;
  return (draft) => {
    if (failNext) {
      failNext = false;
      return false;
    }
    return save(draft);
  };
}

/**
 * The saved draft, or null if there isn't a usable one.
 * Returns { entries, rationale } with every value as text, exactly as it was typed.
 */
export function loadDraft(storage = browserStorage()) {
  if (!storage) return null;
  try {
    const draft = JSON.parse(storage.getItem(KEY));
    if (!draft || draft.version !== 1 || typeof draft.entries !== 'object') return null;
    if (!FIELDS.every((field) => typeof draft.entries[field] === 'string')) return null;
    return {
      entries: Object.fromEntries(FIELDS.map((field) => [field, draft.entries[field]])),
      rationale: typeof draft.rationale === 'string' ? draft.rationale : '',
    };
  } catch {
    return null;
  }
}
