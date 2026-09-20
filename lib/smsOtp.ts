export const REQUIRED_SMS_ENV_VARS = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE"];

/** True only when every Twilio credential this app needs is actually set. */
export function isSmsConfigured(): boolean {
  return REQUIRED_SMS_ENV_VARS.every((key) => Boolean(process.env[key]));
}

/**
 * The response an SMS-dependent endpoint returns when Twilio isn't
 * configured — the feature is reported as unavailable rather than faked
 * (no OTP is generated or "sent"), and lists exactly what's missing so a
 * developer can wire it up.
 */
export function smsNotConfiguredResponse() {
  const missing = REQUIRED_SMS_ENV_VARS.filter((key) => !process.env[key]);
  return {
    error: "SMS verification isn't configured on this server yet.",
    missingEnvVars: missing,
  };
}
