/**
 * A short, hand-picked list of well-known disposable/temp-mail domains —
 * not a comprehensive third-party list (nothing like that is wired up),
 * so this only ever rejects the obvious cases and never blocks a real
 * provider by mistake.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "throwawaymail.com",
  "getnada.com",
  "fakeinbox.com",
  "sharklasers.com",
  "dispostable.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] || "";
  return DISPOSABLE_DOMAINS.has(domain);
}
