export function normalizeText(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

export function normalizeRequiredText(
  value: string
): string {
  return value.trim();
}

export function normalizeEmail(
  value: string
): string {
  return value.trim().toLowerCase();
}

export function normalizeAssetTag(
  value: string
): string {
  return value.trim().toUpperCase();
}

export function normalizeMacAddress(
  value: string
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/-/g, ":");
}