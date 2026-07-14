export function normalizeIssn(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const compact = value.replace(/[^0-9X]/gi, '').toUpperCase();

  if (!/^\d{7}[\dX]$/.test(compact) || !hasValidIssnChecksum(compact)) {
    return null;
  }

  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

export function hasValidIssnChecksum(compactIssn: string): boolean {
  if (!/^\d{7}[\dX]$/.test(compactIssn)) {
    return false;
  }

  const weightedTotal = [...compactIssn.slice(0, 7)].reduce(
    (total, digit, index) => total + Number(digit) * (8 - index),
    0,
  );
  const checkValue = (11 - (weightedTotal % 11)) % 11;
  const expectedCheckDigit = checkValue === 10 ? 'X' : String(checkValue);

  return compactIssn[7] === expectedCheckDigit;
}
