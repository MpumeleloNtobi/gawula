export const NAME_RE = /^\p{L}[\p{L} '-]*\p{L}$/u;

export const NAME_REQUIREMENT =
  "Names may only contain letters, spaces, hyphens and apostrophes";

export function isValidName(value: string): boolean {
  return NAME_RE.test(value.trim());
}

export function nameError(value: string, label = "Name"): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return `Enter your ${label.toLowerCase()}`;
  if (/\d/.test(trimmed)) return `${label} can't contain numbers`;
  const invalid = trimmed.match(/[^\p{L} '-]/u);
  if (invalid) return `${label} can't contain "${invalid[0]}"`;
  if (trimmed.length < 2) return `${label} is too short`;
  if (!NAME_RE.test(trimmed)) return `${label} must start and end with a letter`;
  return null;
}
