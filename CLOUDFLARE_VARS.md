# Cloudflare Variables and Secrets

The following environment variables and secrets must be configured in your Cloudflare dashboard for the application to function correctly.

## 1. Secrets (Encrypted)
These should be added via `Settings > Variables and Secrets` in your Cloudflare Pages project.

- `RESEND_API_KEY`: Your API key from Resend.com (starts with `re_...`)
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret (starts with `GOCSPX...`)
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret (starts with `GOCSPX...`)
- `BILLPLZ_API_KEY`: Billplz Secret Key (UUID format)
- `BILLPLZ_XSIGNATURE_KEY`: Billplz X-Signature Key (for webhook verification)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key from Supabase (starts with `ey...`) - *Optional if using D1 primarily*
- `JWT_SECRET`: Secret key for signing session tokens (if using JWT auth) - *Recommended*

## 2. Environment Variables (Plain Text)
These can be added as plain text variables.

- `BILLPLZ_COLLECTION_ID`: Billplz Collection ID (UUID format)
- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xyz.supabase.co`)
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EMAIL_FROM`: The verified sender address in Resend (e.g., `A2Z Creative <noreply@a2zcreative.my>`)
- `APP_URL`: The canonical URL of your deployed app (e.g., `https://a2zcreative-invites.pages.dev`)

## 3. Worker Bindings
These are configured in `wrangler.toml` but should also be visible in the dashboard under `Settings > Functions > Bindings`.

- `DB`: D1 Database binding (Variable name: `DB`)

## How to Set Variables
1. Go to Cloudflare Dashboard > Pages
2. Select your project `a2zcreative-invites`
3. Click `Settings` > `Variables and Secrets`
4. Click `Add variable`
5. Enter the Name (e.g., `RESEND_API_KEY`) and Value
6. Click `Encrypt` for secrets
7. Save

> **Note**: Variables set here are available to your Functions at runtime via the `env` object.
