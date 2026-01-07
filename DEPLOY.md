# Deployment Guide - A2Z Creative Invites

## Quick Deploy Steps

### 1. Push to GitHub (triggers auto-deploy)
```powershell
git add .
git commit -m "feat: Complete SaaS platform with payment & security"
git push origin main
```

### 2. Cloudflare Pages Setup (First Time Only)

If you haven't connected this repo to Cloudflare Pages yet:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** > **Create application** > **Pages**
3. Click **Connect to Git**
4. Select your repository: `a2zcreative-my/a2zcreative-invites`
5. Configure build settings:
   - **Project name:** `a2zcreative-invites`
   - **Production branch:** `main`
   - **Build command:** (leave empty)
   - **Build output directory:** `src/pages`
6. Click **Save and Deploy**

### 3. Create D1 Database (Production)

```bash
# Create production database
npx wrangler d1 create invites-db-prod

# Note the database_id from output and update wrangler.toml
```

### 4. Run Migrations on Production

```bash
# Schema
npx wrangler d1 execute invites-db-prod --file=schema.sql

# Migrations
npx wrangler d1 execute invites-db-prod --file=migrations/001_add_checkin_token.sql
npx wrangler d1 execute invites-db-prod --file=migrations/002_add_payment_tables.sql

# Seed data (optional)
npx wrangler d1 execute invites-db-prod --file=seed.sql
```

### 5. Bind D1 to Pages

1. Go to your Pages project in Cloudflare Dashboard
2. **Settings** > **Functions** > **D1 database bindings**
3. Add binding:
   - **Variable name:** `DB`
   - **D1 database:** Select `invites-db-prod`
4. Save and redeploy

### 6. Configure Environment Variables (Optional)

In Pages project settings, add these variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `BILLPLZ_API_KEY` - Billplz API key (when ready)

---

## Automatic Deployment

Once connected, every push to `main` will:
1. Trigger Cloudflare Pages build
2. Deploy to production automatically
3. Functions in `/functions` folder are auto-deployed

## Custom Domain

1. Go to Pages project > **Custom domains**
2. Add domain: `invites.a2zcreative.my` (or your domain)
3. Update DNS records as instructed

---

## wrangler.toml Configuration

Update `database_id` with your production database:

```toml
name = "a2z-creative-invites"
compatibility_date = "2024-01-01"
pages_build_output_dir = "src/pages"

[[d1_databases]]
binding = "DB"
database_name = "invites-db-prod"
database_id = "YOUR-PRODUCTION-DATABASE-ID"  # <-- Update this
```

---

## Verify Deployment

After deploy, test these URLs:
- https://your-project.pages.dev/
- https://your-project.pages.dev/pricing/
- https://your-project.pages.dev/api/invitation/aiman-rafhanah
