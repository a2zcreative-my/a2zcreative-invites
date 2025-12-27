# A2Z Creative - Production D1 Database Setup (PowerShell)
# =============================================
# 
# This script will:
# 1. Create a new D1 production database
# 2. Run all migrations
# 3. Seed demo data
#
# After running, update wrangler.toml with the database ID
# =============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  A2Z Creative - D1 Database Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if npx is available
$npxPath = Get-Command npx -ErrorAction SilentlyContinue
if (-not $npxPath) {
    Write-Host "ERROR: npx not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/5] Creating production database..." -ForegroundColor Green
Write-Host ""
npx wrangler d1 create invites-db-prod
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "IMPORTANT: Copy the database_id above!" -ForegroundColor Yellow
Write-Host "You will need to update wrangler.toml with this ID." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter after copying the ID to continue"

Write-Host ""
Write-Host "[2/5] Running main schema..." -ForegroundColor Green
npx wrangler d1 execute invites-db-prod --file=schema.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to run schema.sql" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Schema created successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Running migration 001 (check-in tokens)..." -ForegroundColor Green
npx wrangler d1 execute invites-db-prod --file=migrations/001_add_checkin_token.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to run migration 001" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Migration 001 complete!" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Running migration 002 (payment tables)..." -ForegroundColor Green
npx wrangler d1 execute invites-db-prod --file=migrations/002_add_payment_tables.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to run migration 002" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Migration 002 complete!" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Seeding demo data..." -ForegroundColor Green
npx wrangler d1 execute invites-db-prod --file=seed.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to seed data (this is optional)" -ForegroundColor Yellow
}
Write-Host "Seed data loaded!" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DATABASE SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Copy the database_id from above" -ForegroundColor White
Write-Host "2. Update wrangler.toml with the new ID" -ForegroundColor White
Write-Host "3. Go to Cloudflare Dashboard" -ForegroundColor White
Write-Host "4. Bind the database to your Pages project:" -ForegroundColor White
Write-Host "   Settings > Functions > D1 database bindings" -ForegroundColor Gray
Write-Host "   Variable: DB" -ForegroundColor Gray
Write-Host "   Database: invites-db-prod" -ForegroundColor Gray
Write-Host "5. Redeploy your project" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
