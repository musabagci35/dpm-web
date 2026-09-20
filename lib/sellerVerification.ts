/** A seller may publish, pay, or submit a listing only once they've verified at least one contact channel. */
export function hasVerifiedContact(seller: { emailVerified?: boolean; phoneVerified?: boolean }): boolean {
  return Boolean(seller.emailVerified || seller.phoneVerified);
}

export const UNVERIFIED_CONTACT_ERROR =
  "Verify your email or phone number before submitting or paying for a listing. Check your inbox for the verification link, or add a phone number in your account.";
