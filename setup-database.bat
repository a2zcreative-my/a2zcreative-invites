@echo off
REM =============================================
REM A2Z Creative - Production D1 Database Setup
REM =============================================
REM 
REM This script will:
REM 1. Create a new D1 production database
REM 2. Run all migrations
REM 3. Seed demo data
REM
REM After running, update wrangler.toml with the database ID
REM =============================================

echo.
echo ============================================
echo   A2Z Creative - D1 Database Setup
echo ============================================
echo.

REM Check if wrangler is available
where npx >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: npx not found. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Creating production database...
echo.
call npx wrangler d1 create invites-db-prod
echo.
echo ============================================
echo IMPORTANT: Copy the database_id above!
echo You will need to update wrangler.toml with this ID.
echo ============================================
echo.
pause

echo.
echo [2/5] Running main schema...
call npx wrangler d1 execute invites-db-prod --file=schema.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to run schema.sql
    pause
    exit /b 1
)
echo Schema created successfully!

echo.
echo [3/5] Running migration 001 (check-in tokens)...
call npx wrangler d1 execute invites-db-prod --file=migrations/001_add_checkin_token.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to run migration 001
    pause
    exit /b 1
)
echo Migration 001 complete!

echo.
echo [4/5] Running migration 002 (payment tables)...
call npx wrangler d1 execute invites-db-prod --file=migrations/002_add_payment_tables.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to run migration 002
    pause
    exit /b 1
)
echo Migration 002 complete!

echo.
echo [5/5] Seeding demo data...
call npx wrangler d1 execute invites-db-prod --file=seed.sql
if %ERRORLEVEL% neq 0 (
    echo WARNING: Failed to seed data (this is optional)
)
echo Seed data loaded!

echo.
echo ============================================
echo   DATABASE SETUP COMPLETE!
echo ============================================
echo.
echo Next steps:
echo 1. Copy the database_id from above
echo 2. Update wrangler.toml with the new ID
echo 3. Go to Cloudflare Dashboard
echo 4. Bind the database to your Pages project:
echo    Settings ^> Functions ^> D1 database bindings
echo    Variable: DB
echo    Database: invites-db-prod
echo 5. Redeploy your project
echo.
echo ============================================
pause
