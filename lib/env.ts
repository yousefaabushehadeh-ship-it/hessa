export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Without Supabase keys the app runs on sample data, with a fixed OTP code. */
export const DEMO_MODE = !(SUPABASE_URL && SUPABASE_ANON_KEY);
export const DEMO_OTP = "482913";
/** How the login code is sent: WhatsApp by default, or "sms". Both go through the SMS provider set in Supabase (Twilio). */
export const OTP_CHANNEL: "whatsapp" | "sms" = process.env.OTP_CHANNEL === "sms" ? "sms" : "whatsapp";
/** The access code shown on the redeem page; in the demo it works for every visitor, not just the first. */
export const DEMO_CODE = "HS-KHALED-02";
