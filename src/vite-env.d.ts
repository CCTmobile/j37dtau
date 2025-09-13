/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_PHONE_NUMBER_ID: string;
  readonly VITE_WHATSAPP_ACCESS_TOKEN: string;
  readonly VITE_WHATSAPP_WEBHOOK_TOKEN: string;
  readonly VITE_WHATSAPP_BUSINESS_NUMBER: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}