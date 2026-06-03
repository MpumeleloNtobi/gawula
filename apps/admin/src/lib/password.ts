export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_REQUIREMENT =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character";

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RE.test(value);
}
