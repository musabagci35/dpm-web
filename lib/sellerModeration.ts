/** Any non-"active" status blocks login, sessions, and every seller-authenticated action — see lib/sellerSession.ts and the auth routes. */
export function isSellerBlocked(status: string): boolean {
  return status !== "active";
}

export const GENERIC_ACCOUNT_STATUS_MESSAGE =
  "This account is not currently active. Contact Drive Prime Motors support for help.";
