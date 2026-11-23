import { describe, it, expect } from 'vitest';
import { saveDraft, loadDraft, createSaver } from './draftStorage.js';

// A stand-in for the browser's storage, so the tests don't need a browser.
const fakeStorage = () => {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    raw: items,
  };
};

describe('saving and restoring a draft', () => {
  it('restores exactly what was typed, including invalid text and the reason', () => {
    const storage = fakeStorage();
    const draft = { entries: { triage: '60', exceptions: '12.0', knowledge: 'abc' }, rationale: 'Line one\nLine two' };
    expect(saveDraft(draft, storage)).toBe(true);
    expect(loadDraft(storage)).toEqual(draft);
  });

  it('gives nothing when there is no saved draft', () => {
    expect(loadDraft(fakeStorage())).toBeNull();
  });

  it('gives nothing, rather than breaking, when the saved draft is damaged or the wrong shape', () => {
    const storage = fakeStorage();
    for (const bad of ['not json', '{"version":1}', '{"version":2,"entries":{}}', '{"version":1,"entries":{"triage":48}}']) {
      storage.setItem('support-capacity-proposal:draft', bad);
      expect(loadDraft(storage)).toBeNull();
    }
  });

  it('reports failure, rather than breaking, when the browser refuses to store', () => {
    const refusing = { setItem: () => { throw new Error('QuotaExceeded'); }, getItem: () => null };
    expect(saveDraft({ entries: { triage: '48', exceptions: '0', knowledge: '0' }, rationale: '' }, refusing)).toBe(false);
    expect(saveDraft({ entries: {}, rationale: '' }, null)).toBe(false);
    expect(loadDraft(null)).toBeNull();
  });
});

describe('the recoverable save error (?save=error)', () => {
  const draft = () => ({ entries: { triage: '60', exceptions: '12.0', knowledge: 'abc' }, rationale: 'Line one\nLine two' });
  // Saves into a fake storage, so we can see exactly what was stored.
  const saverWith = (settings) => {
    const storage = fakeStorage();
    const save = createSaver(settings, (d) => saveDraft(d, storage));
    return { storage, save };
  };

  it('the first save fails and stores nothing', () => {
    const { storage, save } = saverWith({ failFirstSave: true });
    expect(save(draft())).toBe(false);
    expect(loadDraft(storage)).toBeNull();
  });

  it('the retry succeeds and stores exactly what was typed', () => {
    const { storage, save } = saverWith({ failFirstSave: true });
    save(draft());
    expect(save(draft())).toBe(true);
    expect(loadDraft(storage)).toEqual(draft());
  });

  it('the failure never changes the entries', () => {
    const { save } = saverWith({ failFirstSave: true });
    const entriesBefore = draft();
    // Frozen: any attempt to change them would throw.
    const frozen = Object.freeze({ ...entriesBefore, entries: Object.freeze({ ...entriesBefore.entries }) });
    expect(save(frozen)).toBe(false);
    expect(frozen).toEqual(entriesBefore);
    expect(save(frozen)).toBe(true);
    expect(frozen).toEqual(entriesBefore);
  });

  it('only the first save fails; every later save works', () => {
    const { save } = saverWith({ failFirstSave: true });
    expect([save(draft()), save(draft()), save(draft()), save(draft())]).toEqual([false, true, true, true]);
  });

  it('without the demo setting, the first save works', () => {
    const { save } = saverWith({ failFirstSave: false });
    expect(save(draft())).toBe(true);
  });

  it('a draft saved after a failure is restored exactly when the page next opens', () => {
    const { storage, save } = saverWith({ failFirstSave: true });
    save(draft());
    save(draft());
    // A new page load reads the same storage.
    expect(loadDraft(storage)).toEqual(draft());
  });
});
