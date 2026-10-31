# حِصّة: notes for Claude

- Next.js 15 App Router + TypeScript (strict) + Supabase. No Tailwind: styles are the prototype's CSS in `app/globals.css`, reuse its class names (`card`, `btn btn-pri`, `pill p-ok`, `tgrid`, `panel`, `ph2`...).
- UI text is Arabic in Jordanian dialect, `dir="rtl"`. Keep copy short and friendly, no em-dashes.
- All data access goes through `lib/data.ts`; every function has a demo branch (`DEMO_MODE` when Supabase env vars are missing) and a Supabase branch. Keep both working.
- Demo state that server actions mutate lives on `globalThis` (`lib/demo-data.ts`, `lib/data.ts`, `lib/demo-store.ts`), because Next loads modules once per route bundle.
- Quiz answers never leave the database for students: read questions through `quiz_for_student`, grade through `submit_quiz`.
- Video: `lib/bunny.ts` signs uploads (TUS from the browser) and embed URLs. Never send `BUNNY_*` keys to the client.
- To test SQL locally, Postgres 16 is installed: load a small stub for Supabase's `auth`/`storage` schemas, then the migrations.
- Roles: student, teacher, school, admin (`lib/nav.ts` has each menu; `requireRole` sends people to their own dashboard). Admin pages read with the service key after `requireRole("admin")` (`lib/platform.ts`).
- Study kit (books, explainer videos, summaries, links per teacher) is `resources` (migration 0006). Students read it only through `teacher_resources` / `open_resource` (`lib/resources.ts`); kit PDFs are served stamped by `app/api/resource/[id]`.
- Big files (lesson PDFs, hand-ins, documents) go from the browser to Storage through a signed upload URL, never through a server action (hosting caps a request at a few MB). Lesson PDFs are served by `app/api/material/[id]`, which checks access and stamps the student on every page.
- Mutations are server actions in `app/actions/*`, returning `{ ok?, error? }` for `useActionState`.
- Security lives in the database: RLS policies and `protect_fields` in `supabase/migrations/0001_init.sql`. New tables need RLS on. New migrations go in a new numbered file.
- Before pushing: `npm run typecheck && npm run build`.

## Language
- English is the source and default language. Write every UI string as `t("English text")`; Arabic lives in `lib/i18n/ar.ts`, keyed by the English text. A missing key falls back to English.
- The language is stored in the `hessa_lang` cookie (`en` or `ar`), set from Settings or the nav switch. Sample data (teacher names, bios, lesson titles) stays in Arabic.
- Keep placeholders such as `{name}` identical in the key and the translation.
