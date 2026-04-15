myportfolio

## Newsletter Setup (Supabase + Resend)

1. Run `supabase/newsletter_schema.sql` in your Supabase SQL editor.
2. Add these environment variables in Vercel (and local `.env` for dev):
   - `SUPABASE_URL` (or reuse `VITE_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NEWSLETTER_FROM_EMAIL` (must be a verified Resend sender)
   - `CRON_SECRET`
   - `DEVTO_USERNAME` (optional; defaults to `strykerinside`)
3. Deploy. Vercel cron calls `/api/newsletter/dispatch` every 15 minutes.

### Endpoints

- `POST /api/newsletter/subscribe` with JSON `{ "email": "name@example.com" }`
- `GET /api/newsletter/dispatch` (protected by `CRON_SECRET`)
