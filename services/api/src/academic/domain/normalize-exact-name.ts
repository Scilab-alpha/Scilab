export function normalizeExactName(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('en-US');

  return normalized || null;
}
