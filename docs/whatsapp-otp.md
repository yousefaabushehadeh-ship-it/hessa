# Login code on WhatsApp

Students and teachers sign in with their mobile number (any country; Jordan is the default). The site asks Supabase for a code with
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

## Testing for free (Twilio trial)

A trial Twilio account can send SMS only to numbers you verified in Twilio (your own number is verified
when you sign up), paid from the free trial credit. That is enough to test the whole login:

1. In Twilio, copy the Account SID and Auth Token from the console home, and get a trial number
   (Phone Numbers → Buy a number; it is paid from the trial credit).
2. In Supabase, Authentication → Sign In / Providers → Phone → Twilio: paste the SID, the token and the
   Twilio number (or a Message Service SID).
3. Set `OTP_CHANNEL=sms` in Netlify, because WhatsApp needs an approved sender first.
4. Sign up on the site with your own number; the code arrives by SMS.

Other people can test with Supabase "Test phone numbers" (a fixed code, nothing is sent), or after you
verify their number in Twilio. Upgrade the Twilio account before launch so it can message any number.

## Testing before Meta approves

Twilio's WhatsApp sandbox works with numbers that first send the join word to the sandbox number. Supabase
also has "Test phone numbers" (Phone provider settings) that accept a fixed code without sending anything.

## Notes

- A number can ask for a new code once a minute; the site shows "wait a minute" when that happens.
- Each WhatsApp authentication message is billed by Meta plus Twilio's fee; check current prices for Jordan
  in Twilio's pricing page before launch.
