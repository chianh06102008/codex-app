// T04 (category tap), T08 (draft survives a killed app), PRD Flow: report.
import { createDraftStore, emptyDraft, type KeyValueStorage, type ReportDraft } from './draftCore';
import { allowedCategories, canPublish, restoreDraft } from './rules';

const ready = (p: Partial<ReportDraft> = {}): ReportDraft => ({
  ...emptyDraft(),
  step: 4,
  dryAck: true,
  photoUri: 'file:///redacted.jpg',
  segmentId: '123:0',
  point: { latitude: 16.06, longitude: 108.22 },
  vision: { ok: true, category: 'ankle', confidence: 0.7, reference_objects: ['curb'], mock: false },
  ...p,
});

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async (k) => void data.delete(k),
  };
}

describe('T04 explicit category tap', () => {
  test('cannot publish without a category, even when the model proposed one', () => {
    expect(canPublish(ready({ category: null }), false)).toBe(false);
  });

  test('publishes once a category is tapped', () => {
    expect(canPublish(ready({ category: 'wheel' }), false)).toBe(true);
  });

  test('vision timeout or failure still allows unknown, and only unknown', () => {
    for (const reason of ['timeout', 'error', 'not_configured', 'invalid'] as const) {
      const v = { ok: false as const, reason };
      expect(allowedCategories(v, false)).toEqual(['unknown']);
      expect(canPublish(ready({ vision: v, category: 'unknown' }), false)).toBe(true);
      expect(canPublish(ready({ vision: v, category: 'ankle' }), false)).toBe(false);
    }
  });

  test('while the model is still analyzing, only unknown is allowed', () => {
    expect(allowedCategories(null, true)).toEqual(['unknown']);
    expect(canPublish(ready({ category: 'wheel' }), true)).toBe(false);
  });

  test('cannot publish without the dry-ground acknowledgement or a confirmed road', () => {
    expect(canPublish(ready({ category: 'unknown', dryAck: false }), false)).toBe(false);
    expect(canPublish(ready({ category: 'unknown', segmentId: null }), false)).toBe(false);
  });
});

describe('T08 draft persistence', () => {
  test('a draft saved at step 3 is restored after the app is killed', async () => {
    const storage = memoryStorage();
    await createDraftStore(storage).save(ready({ step: 3, category: null, vision: null }));
    // "Kill": a brand-new store over the same storage, as on the next launch.
    const restored = restoreDraft(await createDraftStore(storage).load());
    expect(restored?.step).toBe(3);
    expect(restored?.segmentId).toBe('123:0');
  });

  test('a vision call cannot survive a restart: restored draft offers only unknown', async () => {
    const storage = memoryStorage();
    await createDraftStore(storage).save(ready({ step: 4, vision: null, category: 'wheel' }));
    const restored = restoreDraft(await createDraftStore(storage).load())!;
    expect(allowedCategories(restored.vision, false)).toEqual(['unknown']);
    expect(restored.category).toBeNull();
  });

  test('finished or untouched drafts are not restored', () => {
    expect(restoreDraft(ready({ step: 5 }))).toBeNull();
    expect(restoreDraft(emptyDraft())).toBeNull();
    expect(restoreDraft(null)).toBeNull();
  });

  test('corrupt storage does not crash the flow', async () => {
    const storage = memoryStorage();
    storage.data.set('floodscout.reportDraft.v1', '{not json');
    expect(await createDraftStore(storage).load()).toBeNull();
  });

  test('clear removes the draft after publishing', async () => {
    const storage = memoryStorage();
    const store = createDraftStore(storage);
    await store.save(ready());
    await store.clear();
    expect(await store.load()).toBeNull();
  });
});
