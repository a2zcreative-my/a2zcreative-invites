# API Migration Roadmap - Step-by-Step Guide

## Current Progress: 15/32 Routes Complete (47%)

---

## Phase 1: Payment Routes (CRITICAL)

These are blocking features and must be implemented ASAP.

### 1. GET /api/payment/status

**Original**: `functions/api/payment/status.js`  
**Location**: `src/app/api/payment/status/route.ts`

**Required Functionality**:
- Get payment status for an event
- Check Billplz payment order status
- Return payment_state and lifecycle_state
- Only accessible to event owner

**Key Security Checks**:
- [x] Require authentication
- [x] Verify event ownership
- [x] Return minimal data (never expose API keys)

**Database Queries**:
```sql
-- Get event and payment status
SELECT e.*, po.status, po.reference_id, po.amount
FROM events e
LEFT JOIN payment_orders po ON e.id = po.event_id
WHERE e.id = ? AND e.created_by = ?

-- Check Billplz status via API
-- This may require external API call to Billplz
```

### 2. POST /api/payment/create

**Original**: `functions/api/payment/create.js`  
**Location**: `src/app/api/payment/create/route.ts`

**Required Functionality**:
- Create a payment order for an event
- Call Billplz API to create bill
- Store order details in database
- Return payment URL to redirect user

**Key Security Checks**:
- [x] Require authentication
- [x] Verify event ownership
- [x] Validate event status allows payment
- [x] Check for existing pending payment
- [x] Store encrypted payment details

**Critical Fields**:
- eventId
- amount (from pricing tier)
- customerEmail
- customerPhone
- description

### 3. POST /api/payment/verify

**Original**: `functions/api/payment/verify.js`  
**Location**: `src/app/api/payment/verify/route.ts`

**Required Functionality**:
- Verify payment completion
- Call Billplz API to verify
- Update event payment_state to PAID
- Update event lifecycle_state accordingly
- Send confirmation email

**Key Security Checks**:
- [x] Validate signature from Billplz
- [x] Prevent double-processing
- [x] Atomic transaction (verify + state update)
- [x] Log all verification attempts

**Database State Updates**:
```sql
UPDATE events
SET payment_state = 'PAID',
    lifecycle_state = CASE
        WHEN event_date > NOW() THEN 'SCHEDULED'
        WHEN event_date <= NOW() THEN 'LIVE'
        ELSE 'ENDED'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

### 4. POST /api/webhook/billplz

**Original**: `functions/api/webhook/billplz.js`  
**Location**: `src/app/api/webhook/billplz/route.ts`

**Required Functionality**:
- Handle Billplz payment webhook callbacks
- Validate webhook signature (CRITICAL!)
- Update payment order status
- Trigger event state transitions
- Handle idempotency (same webhook fired multiple times)

**Key Security Checks**:
- [x] MUST validate X-Signature header
- [x] Use BILLPLZ_XSIGNATURE_KEY from env
- [x] Verify request body hash matches signature
- [x] Idempotency check (don't reprocess same payment)
- [x] Log all webhook calls

**Signature Validation Algorithm**:
```typescript
// Billplz sends X-Signature header
// Hash = SHA256(request_body + BILLPLZ_XSIGNATURE_KEY)
// Compare: provided_signature == Hash

import crypto from 'crypto';

function validateBillplzSignature(
    requestBody: string,
    xSignature: string,
    key: string
): boolean {
    const hash = crypto
        .createHmac('sha256', key)
        .update(requestBody)
        .digest('hex');
    return hash === xSignature;
}
```

**Webhook Payload Example**:
```json
{
    "id": "billplz_bill_id",
    "collection_id": "collection_id",
    "paid": true,
    "state": "completed",
    "amount": 29900,
    "paid_amount": 29900,
    "due_at": "2024-01-31",
    "email": "user@example.com",
    "mobile": "60123456789",
    "name": "John Doe",
    "url": "https://billplz.com/bill/123",
    "reference_1_label": "event_id",
    "reference_1": "12345",
    "reference_2_label": "user_id",
    "reference_2": "67890"
}
```

---

## Phase 2: Admin Routes (Important)

These enable admin functionality and management.

### 5. GET /api/admin/dashboard

**Location**: `src/app/api/admin/dashboard/route.ts`

**Required Authorization**:
```typescript
if (user.role !== 'super_admin') {
    return errorResponse('Admin access required', 403);
}
```

**Required Data**:
- Total users
- Total events created
- Total revenue
- Recent events
- Pending payments
- System health metrics

### 6-10. Other Admin Routes

Similar pattern:
- Check `super_admin` role
- Query cross-user data
- Implement proper filtering/pagination
- Return aggregated statistics

---

## Phase 3: Template Routes

These support custom event templates.

### 11-15. Template CRUD Routes

**Pattern**:
```typescript
// GET /api/templates - List user's templates
// POST /api/templates - Create template
// GET /api/templates/[id] - Get single template
// PUT /api/templates/[id] - Update template
// DELETE /api/templates/[id] - Delete template (soft-delete)
```

**Key Features**:
- Soft delete (preserve template data)
- Template versioning
- User ownership verification
- Default template for free users

---

## Phase 4: User & Utility Routes

### 16. GET/POST /api/user/subscription

**Location**: `src/app/api/user/subscription/route.ts`

**GET**: Return user's subscription status, features, limits  
**POST**: Update subscription (may trigger payment)

### 17. GET /api/guest/[id]/qr

**Location**: `src/app/api/guest/[id]/qr/route.ts`

**Functionality**:
- Generate QR code for check-in token
- Return as image (PNG/SVG)
- Include guest name and token info
- Cache QR code to avoid regeneration

**Library**: Use `qrcode` npm package
```bash
npm install qrcode
```

---

## Template: Creating a New Route

### Step 1: Read Original File
```bash
# Find the original Cloudflare Worker
cat functions/api/[path].js
```

### Step 2: Identify Dependencies
- What functions from lib/ are used?
- What database queries?
- What authentication/authorization?
- What external APIs?

### Step 3: Create Route File
```bash
mkdir -p src/app/api/[path]
touch src/app/api/[path]/route.ts
```

### Step 4: Implement
```typescript
/**
 * [METHOD] /api/[path] - [Description]
 */

import { getEnv, errorResponse, requireAuth } from '@/lib/utils';
import { getClientIP } from '@/lib/security';

export async function POST(request: Request) {
    const db = getEnv(request).DB;
    
    // 1. Check auth if needed
    const authResult = await requireAuth(request);
    if (authResult.error) {
        return errorResponse(authResult.error, 401);
    }
    const user = authResult.user!;
    
    // 2. Parse request
    let data;
    try {
        data = await request.json();
    } catch (e) {
        return errorResponse('Invalid JSON', 400);
    }
    
    // 3. Validate input
    if (!data.required_field) {
        return errorResponse('Missing required_field', 400);
    }
    
    try {
        // 4. Check permissions
        const resource = await db.prepare(`
            SELECT * FROM table WHERE id = ?
        `).bind(data.id).first();
        
        if (!resource || resource.owner_id !== user.id) {
            return errorResponse('Not authorized', 403);
        }
        
        // 5. Execute business logic
        const result = await db.prepare(`
            UPDATE table SET ... WHERE id = ?
        `).bind(...).run();
        
        // 6. Log action
        await db.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, ?, ?, ?)
        `).bind(null, 'action_name', JSON.stringify(data), getClientIP(request)).run();
        
        // 7. Return success
        return new Response(JSON.stringify({
            success: true,
            data: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error: any) {
        console.error('Error:', error);
        return errorResponse('Operation failed', 500);
    }
}
```

### Step 5: Test
```bash
# Test with curl
curl -X POST http://localhost:3000/api/[path] \
  -H "Content-Type: application/json" \
  -H "Cookie: a2z_session=..." \
  -d '{ "field": "value" }'
```

### Step 6: Build & Verify
```bash
npm run build
```

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/lib/...'"
**Solution**: Ensure file exists in `src/lib/` and tsconfig.json has correct path alias

### Issue: "DB is undefined"
**Solution**: Use `const db = getEnv(request).DB;` to get D1 database reference

### Issue: "Dynamic routes not working"
**Solution**: Removed `output: 'export'` from next.config.js (already done)

### Issue: "User ownership check failing"
**Solution**: Ensure comparing `Number(resource.owner_id) === Number(user.id)` due to type coercion

### Issue: "Rate limiting not working"
**Solution**: Remember it's in-memory (resets on restart). Use Redis/Durable Objects for production

---

## Testing Strategy

### Unit Tests (if using Jest)
- Test sanitization functions
- Test rate limiting logic
- Test ownership verification

### Integration Tests
- Create event flow
- RSVP and check-in flow
- Admin operations
- Payment flow (with Billplz sandbox)

### Security Tests
- IDOR exploitation attempts
- Rate limit bypass attempts
- SQL injection attempts
- XSS in input fields
- CSRF token validation

---

## Deployment Checklist

Before deploying to production:

- [ ] All 32 routes implemented and tested
- [ ] Environment variables set (BILLPLZ_API_KEY, etc.)
- [ ] Database migrations run
- [ ] Rate limiting configured for Durable Objects/Redis
- [ ] Audit logging verified
- [ ] Payment webhook tested with Billplz
- [ ] Admin functions tested by super_admin user
- [ ] All error responses are appropriate
- [ ] Session token rotation working
- [ ] CORS headers correct (if needed)
- [ ] Old functions/api/ directory removed

---

## Quick Command Reference

```bash
# Build project
npm run build

# Start dev server
npm run dev

# List all routes
find src/app/api -name "route.ts" | sort

# Count routes
find src/app/api -name "route.ts" | wc -l

# Test a route
curl -X GET http://localhost:3000/api/events \
  -H "Cookie: a2z_session=your_token"
```

---

## Resources

- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [Billplz API Reference](https://billplz.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Contact & Questions

When implementing remaining routes:
1. Check original Cloudflare Worker implementation
2. Verify all security checks are in place
3. Test with the existing test suite
4. Ensure audit logging is present

Happy migrating! 🚀

