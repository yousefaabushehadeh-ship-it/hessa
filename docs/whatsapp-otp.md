# Login code on WhatsApp

Students and teachers sign in with their Jordanian number. The site asks Supabase for a code with
`channel: "whatsapp"`, and Supabase sends it through Twilio. Without Supabase keys the site runs on sample
data and the code is always 482913, so no message is sent.

## What to set up (once)

1. **Supabase project**: put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` in Netlify (Site configuration → Environment variables), then redeploy.
2. **Twilio account** (twilio.com), upgraded from trial so it can message any number.
3. **WhatsApp sender in Twilio**: Messaging → Senders → WhatsApp senders. Twilio walks you through linking
   a Meta Business account and a phone number that isn't already on WhatsApp. Meta has to approve the
   business, which can take a few days.
4. **Message service**: Messaging → Services → create one and add the WhatsApp sender (and an SMS number if
   you want SMS as a backup).
5. **Supabase**: Authentication → Sign In / Providers → Phone → turn it on, choose **Twilio**, and paste the
   Account SID, Auth Token and Message Service SID. Leave the OTP length at 6.
6. Optional: set `OTP_CHANNEL=sms` in Netlify to go back to plain SMS without touching the code.

## Testing before Meta approves

Twilio's WhatsApp sandbox works with numbers that first send the join word to the sandbox number. Supabase
also has "Test phone numbers" (Phone provider settings) that accept a fixed code without sending anything.

## Notes

- A number can ask for a new code once a minute; the site shows "wait a minute" when that happens.
- Each WhatsApp authentication message is billed by Meta plus Twilio's fee; check current prices for Jordan
  in Twilio's pricing page before launch.
