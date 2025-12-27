# Cloudflare Rate Limiting Rules

Configure these rules in Cloudflare Dashboard > Security > WAF > Rate Limiting Rules

## Rule 1: RSVP Spam Protection
- **Name:** RSVP Rate Limit
- **Expression:** `(http.request.uri.path eq "/api/rsvp" and http.request.method eq "POST")`
- **Rate:** 5 requests per 1 minute
- **Action:** Block for 10 minutes
- **Response:** Custom HTML with 429 status

## Rule 2: API General Rate Limit
- **Name:** API General Limit
- **Expression:** `(http.request.uri.path matches "^/api/.*")`
- **Rate:** 100 requests per 1 minute
- **Action:** Block for 5 minutes

## Rule 3: Auth Brute Force Protection
- **Name:** Auth Rate Limit
- **Expression:** `(http.request.uri.path matches "^/auth/.*" or http.request.uri.path matches "^/api/payment/.*")`
- **Rate:** 10 requests per 5 minutes
- **Action:** Challenge (CAPTCHA)

## Rule 4: Export Abuse Prevention
- **Name:** Export Rate Limit
- **Expression:** `(http.request.uri.path eq "/api/export/guests")`
- **Rate:** 5 requests per 5 minutes
- **Action:** Block for 30 minutes

---

# Cloudflare WAF Custom Rules

## Block Suspicious User Agents
```
(http.user_agent contains "bot" and not http.user_agent contains "Googlebot") or
(http.user_agent contains "curl") or
(http.user_agent contains "wget") or
(http.user_agent eq "")
```
**Action:** Challenge

## Block Common Attack Patterns
```
(http.request.uri.query contains "<script") or
(http.request.uri.query contains "javascript:") or
(http.request.uri.query contains "SELECT") or
(http.request.uri.query contains "UNION") or
(http.request.uri.query contains "../")
```
**Action:** Block

## Geo-blocking (Optional - Malaysia Focus)
```
(not ip.geoip.country in {"MY" "SG" "BN" "ID"})
```
**Action:** Challenge

---

# Security Headers (Already in Middleware)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

# Cloudflare Page Rules

## Force HTTPS
- **URL:** `*a2zcreative.my/*`
- **Setting:** Always Use HTTPS

## Cache Static Assets
- **URL:** `*a2zcreative.my/css/*`
- **Setting:** Cache Level: Cache Everything, Edge Cache TTL: 1 month

## No Cache for API
- **URL:** `*a2zcreative.my/api/*`
- **Setting:** Cache Level: Bypass
