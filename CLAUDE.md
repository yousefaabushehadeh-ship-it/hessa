# حِصّة: notes for Claude

- Next.js 15 App Router + TypeScript (strict) + Supabase. No Tailwind: styles are the prototype's CSS in `app/globals.css`, reuse its class names (`card`, `btn btn-pri`, `pill p-ok`, `tgrid`, `panel`, `ph2`...).
- UI text is Arabic in Jordanian dialect, `dir="rtl"`. Keep copy short and friendly, no em-dashes.
- All data access goes through `lib/data.ts`; every function has a demo branch (`DEMO_MODE` when Supabase env vars are missing) and a Supabase branch. Keep both working.
- Demo state that server actions mutate lives on `globalThis` (`lib/demo-data.ts`, `lib/data.ts`), because Next loads modules once per route bundle.
- Mutations are server actions in `app/actions/*`, returning `{ ok?, error? }` for `useActionState`.
- Security lives in the database: RLS policies and `protect_fields` in `supabase/migrations/0001_init.sql`. New tables need RLS on. New migrations go in a new numbered file.
- Before pushing: `npm run typecheck && npm run build`.
