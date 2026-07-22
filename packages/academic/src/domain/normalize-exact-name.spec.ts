import { normalizeExactName } from '@repo/academic/domain/normalize-exact-name';

describe('normalizeExactName', () => {
  it('normalizes Unicode, casing, and whitespace', () => {
    expect(normalizeExactName('  ＳｃｉＬａｂ   Press  ')).toBe('scilab press');
  });

  it('preserves punctuation and diacritics', () => {
    expect(normalizeExactName('Éditions A.B.')).toBe('éditions a.b.');
    expect(normalizeExactName('Editions AB')).toBe('editions ab');
  });

  it('returns null for empty values', () => {
    expect(normalizeExactName('   ')).toBeNull();
  });
});
