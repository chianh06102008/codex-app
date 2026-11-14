import { validateVision } from './vision';

describe('vision contract (PRD §12, P4, T03)', () => {
  test('accepts a valid answer', () => {
    expect(validateVision({ category: 'wheel', confidence: 0.7, reference_objects: ['motorbike wheel'] })).toEqual({
      ok: true, category: 'wheel', confidence: 0.7, reference_objects: ['motorbike wheel'], mock: false,
    });
  });

  test('T03: no reference object -> unknown, even if the model said otherwise', () => {
    const v = validateVision({ category: 'ankle', confidence: 0.9, reference_objects: [] });
    expect(v.ok && v.category).toBe('unknown');
  });

  test('P4: any centimeter / extra measurement field rejects the whole answer', () => {
    expect(validateVision({ category: 'ankle', confidence: 0.9, reference_objects: ['curb'], depth_cm: 12 }).ok).toBe(false);
    expect(validateVision({ category: 'ankle', confidence: 0.9, reference_objects: ['curb'], cm: 12 }).ok).toBe(false);
  });

  test('categories outside the three are rejected', () => {
    expect(validateVision({ category: 'safe', confidence: 1, reference_objects: ['curb'] }).ok).toBe(false);
  });
});
