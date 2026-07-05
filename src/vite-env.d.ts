/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEMO_MODE: string;
  // Stripe Price IDs — set these when you connect Stripe (see src/lib/checkout.ts)
  readonly VITE_STRIPE_PRICE_BASIC: string;
  readonly VITE_STRIPE_PRICE_PROFESSIONAL: string;
  readonly VITE_STRIPE_PRICE_PREMIUM: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
