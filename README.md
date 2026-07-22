# MalluCupid

Creator platform for free/paid posts, messaging, and Razorpay unlocks.

**Live:** https://www.mallucupid.com  
**Stack:** React (Vite) + Supabase (Postgres, Edge Functions, Storage) + Razorpay + Resend

## Local development

1. `npm install`
2. Set Amplify-style env vars (no `.env` committed — secrets stay in Supabase / Amplify):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AUTH_API_URL` → `https://<project>.supabase.co/functions/v1/auth` (no trailing slash)
3. `npm run dev` → http://localhost:3000

## Backend

- Linked project: `rytulzgsuzgicmpvrrxn`
- Migrations: `npx supabase db push`
- Deploy API: `npx supabase functions deploy auth --no-verify-jwt`
- Docs: [DOCUMENTATION.md](./DOCUMENTATION.md)

## Roles

- **Creators** — `/login`, dashboard under `/:username`
- **Fans** — `/userlogin`, public pages `/:username#####`, inbox `/user-inbox`
