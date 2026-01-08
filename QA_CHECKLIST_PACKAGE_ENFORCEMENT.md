# QA Checklist: Package & Event Type Enforcement

## Overview
This checklist validates the server-side enforcement of package rules for the A2Z Creative Invites system.

---

## Pre-requisites
1. Run the migration: `npx wrangler d1 execute invites-db --local --file=migrations/011_package_enforcement.sql`
2. Ensure test user account exists
3. Clear any test data from previous runs

---

## 1. Package Validation Tests

### 1.1 Valid Package IDs
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| POST /api/events/publish with `package: "free"` | 201 Created | | [ ] |
| POST /api/events/publish with `package: "basic"` | 201 Created (pending_payment) | | [ ] |
| POST /api/events/publish with `package: "popular"` | 201 Created (pending_payment) | | [ ] |
| POST /api/events/publish with `package: "business"` | 201 Created (pending_payment) | | [ ] |

### 1.2 Invalid Package IDs
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| POST /api/events/publish with `package: "premium"` | 400 Bad Request | | [ ] |
| POST /api/events/publish with `package: "enterprise"` | 400 Bad Request | | [ ] |
| POST /api/events/publish with `package: ""` | 400 Bad Request | | [ ] |
| POST /api/events/publish with no package | 400 Bad Request | | [ ] |

---

## 2. Event Type Validation Tests

### 2.1 Free Package - All Event Types Allowed
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free + Perkahwinan (Wedding) | 201 Created, status: published | | [ ] |
| Free + Hari Lahir (Birthday) | 201 Created, status: published | | [ ] |
| Free + Keluarga (Family) | 201 Created, status: published | | [ ] |
| Free + Bisnes (Corporate) | 201 Created, status: published | | [ ] |
| Free + Komuniti (Community) | 201 Created, status: published | | [ ] |

### 2.2 Basic Package - All Event Types Allowed
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Basic + Perkahwinan | 201 Created, status: pending_payment | | [ ] |
| Basic + Hari Lahir | 201 Created, status: pending_payment | | [ ] |
| Basic + Keluarga | 201 Created, status: pending_payment | | [ ] |
| Basic + Bisnes | 201 Created, status: pending_payment | | [ ] |
| Basic + Komuniti | 201 Created, status: pending_payment | | [ ] |

### 2.3 Popular Package - Limited Event Types
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Popular + Perkahwinan | 201 Created | | [ ] |
| Popular + Hari Lahir | 201 Created | | [ ] |
| Popular + Keluarga | 201 Created | | [ ] |
| Popular + Bisnes | **400 Bad Request** (not allowed) | | [ ] |
| Popular + Komuniti | **400 Bad Request** (not allowed) | | [ ] |

### 2.4 Business Package - Limited Event Types
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Business + Bisnes | 201 Created | | [ ] |
| Business + Komuniti | 201 Created | | [ ] |
| Business + Perkahwinan | **400 Bad Request** (not allowed) | | [ ] |
| Business + Hari Lahir | **400 Bad Request** (not allowed) | | [ ] |
| Business + Keluarga | **400 Bad Request** (not allowed) | | [ ] |

---

## 3. Publish Behavior Tests

### 3.1 Auto-Publish (Free Package)
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free package publishes immediately | status: "published" | | [ ] |
| Free package sets paid_at | paid_at IS NOT NULL | | [ ] |
| Free package creates event_access | Record exists | | [ ] |

### 3.2 Pending Payment (Paid Packages)
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Basic creates pending_payment | status: "pending_payment" | | [ ] |
| Popular creates pending_payment | status: "pending_payment" | | [ ] |
| Business creates pending_payment | status: "pending_payment" | | [ ] |
| Paid packages have paid_at NULL | paid_at IS NULL | | [ ] |
| Paid packages create event_access | Record exists | | [ ] |

---

## 4. Limit Enforcement Tests

### 4.1 View Limit Enforcement (Atomic)
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free: Views 1-50 succeed | 200 OK | | [ ] |
| Free: View 51 returns 429 | 429 Too Many Requests | | [ ] |
| Basic: Views 1-500 succeed | 200 OK | | [ ] |
| Basic: View 501 returns 429 | 429 Too Many Requests | | [ ] |
| Popular: Views 1-2000 succeed | 200 OK | | [ ] |
| Popular: View 2001 returns 429 | 429 Too Many Requests | | [ ] |
| Business: Views 1-10000 succeed | 200 OK | | [ ] |
| Business: View 10001 returns 429 | 429 Too Many Requests | | [ ] |

### 4.2 View Limit Race Condition Test
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| 100 concurrent requests at limit | Exactly 50 succeed (free) | | [ ] |
| No overshoot beyond limit | view_count <= view_limit | | [ ] |

### 4.3 Guest Limit Enforcement (Atomic)
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free: RSVP 1-10 succeed | 200 OK | | [ ] |
| Free: RSVP 11 returns 429 | 429 Too Many Requests | | [ ] |
| Basic: RSVP 1-100 succeed | 200 OK | | [ ] |
| Basic: RSVP 101 returns 429 | 429 Too Many Requests | | [ ] |
| Popular: RSVP 1-300 succeed | 200 OK | | [ ] |
| Popular: RSVP 301 returns 429 | 429 Too Many Requests | | [ ] |
| Business: RSVP 1-1000 succeed | 200 OK | | [ ] |
| Business: RSVP 1001 returns 429 | 429 Too Many Requests | | [ ] |

### 4.4 Guest Limit Race Condition Test
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| 50 concurrent RSVPs at limit | Exactly 10 succeed (free) | | [ ] |
| No overshoot beyond limit | guest_count <= guest_limit | | [ ] |

---

## 5. Watermark Tests

### 5.1 Watermark Display
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free package: showWatermark | true | | [ ] |
| Basic package: showWatermark | false | | [ ] |
| Popular package: showWatermark | false | | [ ] |
| Business package: showWatermark | false | | [ ] |

### 5.2 Watermark from Server (Not Client)
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Client sends hasWatermark:false with free | Server returns showWatermark:true | | [ ] |
| event_access.has_watermark is authoritative | Matches package rules | | [ ] |

---

## 6. Feature Gating Tests

### 6.1 QR Code Generation
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free: GET /api/guest/:id/qr | 403 Forbidden | | [ ] |
| Basic: GET /api/guest/:id/qr | 200 OK (SVG) | | [ ] |
| Popular: GET /api/guest/:id/qr | 200 OK (SVG) | | [ ] |
| Business: GET /api/guest/:id/qr | 200 OK (SVG) | | [ ] |

### 6.2 QR Scanner / Check-in
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free: POST /api/checkin | 403 Forbidden | | [ ] |
| Basic: POST /api/checkin | 403 Forbidden | | [ ] |
| Popular: POST /api/checkin | 200 OK | | [ ] |
| Business: POST /api/checkin | 200 OK | | [ ] |

### 6.3 CSV Export
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free: GET /api/export/guests | 403 Forbidden | | [ ] |
| Basic: GET /api/export/guests | 403 Forbidden | | [ ] |
| Popular: GET /api/export/guests | 200 OK (CSV) | | [ ] |
| Business: GET /api/export/guests | 200 OK (CSV) | | [ ] |

### 6.4 Multiple Events
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free: Create 2nd event | 403 Forbidden | | [ ] |
| Basic: Create 2nd event | 403 Forbidden | | [ ] |
| Popular: Create 2nd event | 403 Forbidden | | [ ] |
| Business: Create 2nd event | 201 Created | | [ ] |

---

## 7. Event Status Enforcement Tests

### 7.1 Unpublished Events Not Viewable
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| GET /api/invitation/:slug (pending_payment) | 403 Forbidden | | [ ] |
| GET /api/invitation/:slug (draft) | 403 Forbidden | | [ ] |
| GET /api/invitation/:slug (published) | 200 OK | | [ ] |

### 7.2 Unpublished Events Reject RSVP
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| POST /api/rsvp (pending_payment event) | 403 Forbidden | | [ ] |
| POST /api/rsvp (draft event) | 403 Forbidden | | [ ] |
| POST /api/rsvp (published event) | 200 OK | | [ ] |

---

## 8. Database Consistency Tests

### 8.1 event_access Record Created
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Free package creates event_access | 1 row | | [ ] |
| Basic package creates event_access | 1 row | | [ ] |
| Popular package creates event_access | 1 row | | [ ] |
| Business package creates event_access | 1 row | | [ ] |

### 8.2 Correct Values in event_access
| Package | guest_limit | view_limit | has_watermark | features_json | Pass |
|---------|-------------|------------|---------------|---------------|------|
| free | 10 | 50 | 1 | qr:false, qrScanner:false, exportCsv:false | [ ] |
| basic | 100 | 500 | 0 | qr:true, qrScanner:false, exportCsv:false | [ ] |
| popular | 300 | 2000 | 0 | qr:true, qrScanner:true, exportCsv:true | [ ] |
| business | 1000 | 10000 | 0 | qr:true, qrScanner:true, exportCsv:true, multipleEvents:true | [ ] |

---

## 9. Error Message Tests

### 9.1 Malay Error Messages
| Test | Expected Message | Pass |
|------|------------------|------|
| Invalid package | "Pakej tidak sah: ..." | [ ] |
| Invalid event type for package | "Jenis majlis ... tidak dibenarkan untuk pakej ..." | [ ] |
| View limit reached | "Had paparan jemputan telah dicapai" | [ ] |
| Guest limit reached | "Had tetamu telah dicapai untuk majlis ini" | [ ] |
| Feature not allowed | "... memerlukan pakej ... atau lebih tinggi" | [ ] |

---

## 10. Regression Tests

### 10.1 Existing Functionality
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Slug uniqueness check works | 409 Conflict for duplicate | | [ ] |
| Audit logs created | audit_logs has record | | [ ] |
| Rate limiting works | 429 after limit | | [ ] |
| Auth required for publish | 401 without session | | [ ] |

---

## Test Data Setup

### Create Test Users
```sql
INSERT INTO users (name, email, password_hash) VALUES 
('Test User', 'test@example.com', 'hashed_password');
```

### Event Type IDs (from seed data)
- 1 = Wedding/Perkahwinan
- 2 = Corporate/Bisnes
- 3 = Family/Keluarga
- 4 = Birthday/Hari Lahir
- 5 = Community/Komuniti

### Sample Publish Request
```json
{
  "eventType": 1,
  "hostName1": "Ahmad",
  "hostName2": "Siti",
  "eventDate": "2025-06-15",
  "venueName": "Dewan Seri Budiman",
  "slug": "ahmad-siti-2025",
  "package": "free"
}
```

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |
