import { normalizeIssn } from '@/academic/domain/normalize-issn';

describe('normalizeIssn', () => {
  it.each([
    ['15424863', '1542-4863'],
    [' 1542-4863 ', '1542-4863'],
    ['0317-8471', '0317-8471'],
    ['0000-006X', '0000-006X'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeIssn(input)).toBe(expected);
  });

  it.each(['-', '1542-4864', '1234-567', 'not-an-issn', null])(
    'rejects invalid value %s',
    (input) => {
      expect(normalizeIssn(input)).toBeNull();
    },
  );
});
