# A2Z Creative Invites

Multi-Purpose Digital Invitation & Attendance Management Platform

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Cloudflare Workers (Pages Functions)
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Supabase Auth (Phase 3)

## Project Structure
```
├── src/
│   ├── pages/          # Frontend HTML pages
│   ├── css/            # Stylesheets
│   └── js/             # Client-side JavaScript
├── functions/          # Cloudflare Workers API
├── public/             # Static assets
├── schema.sql          # Database schema
├── seed.sql            # Demo data
├── wrangler.toml       # Cloudflare config
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create D1 database**
   ```bash
   wrangler d1 create invites-db
   ```
   Copy the database_id to `wrangler.toml`

3. **Initialize database**
   ```bash
   npm run db:init
   npm run db:seed
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

5. **Deploy**
   ```bash
   npm run deploy
   ```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/i/:slug` | Public invitation page |
| `/admin` | Admin dashboard (Phase 4) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invitation/:slug` | Get invitation data |
| POST | `/api/rsvp` | Submit RSVP |
| GET | `/api/messages/:slug` | Get guest messages |
| POST | `/api/messages/:slug` | Add guest message |

## Phases

- [x] **Phase 1**: Public Invitation + RSVP
- [ ] **Phase 2**: Guest Check-in (QR)
- [ ] **Phase 3**: Event Creation Wizard
- [ ] **Phase 4**: Admin Dashboard

## License
MIT © A2Z Creative Enterprise

<!-- Trigger rebuild -->
