/**
 * One-time voice-cloning add-on.
 *
 * A flat $59 purchase (no monthly fee). After paying, the owner records or
 * uploads a few audio samples and their receptionist speaks in their own cloned
 * voice. The Stripe webhook flips clinics.voice_clone_paid on payment; the
 * clone-voice function does the actual cloning and saves the voice_id.
 *
 * VOICE_CLONE_PAYMENT_LINK is a Stripe Payment Link in **one-time** (mode=payment)
 * mode for the $59 price. Paste it here after creating it in Stripe — the button
 * appends the signed-in user's id/email so the webhook maps the payment back to
 * their account (same mechanism as the plan checkout). Until it's set, the buy
 * button explains the feature is being set up.
 */
export const VOICE_CLONE_PRICE = 59;

export const VOICE_CLONE_PAYMENT_LINK = "";
