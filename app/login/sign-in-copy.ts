/**
 * The words the sign-in screen says, kept apart from the screen that says
 * them: copy this exact is worth reading on its own, and worth checking
 * without standing a React tree up first.
 */

/** How the API words a rejected sign-in, in its own voice. */
const CREDENTIALS_REJECTED =
  /no active account|invalid (credentials|email|password)/i;

/**
 * Being told no is the moment this screen owes the most care, and the API's
 * own words are the least careful version of it.
 *
 * Two cases are worth saying better. Everything else passes through untouched:
 * swallowing an unfamiliar error to sound friendlier costs whoever has to
 * debug it far more than the warmth is worth. `onLine` is only trusted when it
 * is false — the browser can only be sure about being disconnected, never
 * about being reachable — so a captive portal still falls through to whatever
 * the request actually reported.
 */
export function signInMessage(raw: string) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You're offline, so the sign-in never left this device. Reconnect and try again.";
  }
  if (CREDENTIALS_REJECTED.test(raw)) {
    return "That email and password don't match an account. Check for a typo, or ask an administrator to reset the password.";
  }
  return raw;
}
