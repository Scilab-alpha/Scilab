export function formatSavedAt(value: string) {
  const formatted = formatDate(value);

  return formatted ? `Saved ${formatted}` : "Saved recently";
}

export function formatFollowType(value: string) {
  return value[0] + value.slice(1).toLowerCase();
}

export function formatChange(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);

  return `${value > 0 ? "+" : ""}${formatted}%`;
}

export function formatMetric(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function getSoftNegativeColor(isDark: boolean) {
  return isDark ? "#F0B8B2" : "#C8756F";
}

export function getMutedPrimaryBarColor(isDark: boolean) {
  return isDark ? "#B98A7A" : "#B98B7D";
}
