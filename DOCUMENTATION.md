# MalluCupid Documentation

Complete reference for working UI pages, backend APIs, database, payments, and ops. Source of truth: `src/App.tsx`, `src/lib/auth.ts`, `src/lib/admin.ts`, `supabase/functions/auth/index.ts`, migrations `001`–`026`.

---

## 1. Stack & deployment

| Layer | Detail |
|-------|--------|
| Frontend | React + Vite, React Router, Tailwind CSS, `lucide-react` |
| Hosting | AWS Amplify (`ap-southeast-1`) |
| Domain | https://www.mallucupid.com |
| Backend | Supabase project `rytulzgsuzgicmpvrrxn` — Postgres + Edge Function `auth` |
| Payments | Razorpay (live keys as Supabase secrets only) |
| Email | Resend (`AUTH_RESEND_API_KEY`, `AUTH_EMAIL_FROM`) |

**Secrets** live only in Supabase Edge Function secrets and Amplify env vars. Never commit a `.env` file.

**Ops**

```bash
npx supabase db push --password "<DB_PASSWORD>" --yes
npx supabase functions deploy auth --no-verify-jwt --project-ref rytulzgsuzgicmpvrrxn
```

Bootstrap admin: `node scripts/create-admin-user.mjs` (requires `SUPABASE_SERVICE_ROLE_KEY`).

Base API URL: `VITE_AUTH_API_URL` → `…/functions/v1/auth`. Routes accept `/name` and `/auth/name`. Session = HttpOnly cookies (`attachAuthCookies`).

Brand assets: logo `https://res.cloudinary.com/dsamz0zji/image/upload/v1784680966/mallucupidlogo_a44gud.png`; app icon `https://res.cloudinary.com/dsamz0zji/image/upload/v1784680970/appicon_n1we3u.png`.

---

## 2. Roles

| Role | Source of truth | Entry | Home after login |
|------|-----------------|-------|------------------|
| **creator** | `user_accounts.role` | `/login`, `/signup` | `/{username}` dashboard |
| **user** (fan) | `user_accounts.role` | `/userlogin`, `/usersignup` | `/user-inbox` |
| **admin** | `user_accounts.role` (migration `020`) | `/adminlogin` | `/admin{uuid}` |

- DB role is authoritative; JWT metadata is for routing convenience.
- Creator login rejects fan accounts (**"You don't have a creator account"**).
- `CreatorLayout` requires `role === "creator"` and canonical URL username.
- Usernames are permanent after signup (6–25 chars: `[A-Za-z0-9._-]`).

---

## 3. UI routes

### Public / marketing

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing (`Hero`, `HowItWorks`, `CommunityCTA`, `SeoSection`, `Header`, `Footer`) | Marketing home + SEO/FAQ |
| `/terms-and-conditions` | `TermsPage` | Platform terms |
| `/privacy-policy` | `PrivacyPolicyPage` | Privacy |
| `/refund-policy` | `RefundPolicyPage` | Refunds |
| `/contact-us` | `ContactUsPage` | Support / company contact |

Landing header: large brand logo (`BrandLogo` size `xl`), How it Works, Become a creator, Get Started → `/login`.  
Footer: brand blurb, nav links, copyright, Privacy / Terms / Refund (no merchant-address card).

Contact: `456, Gautam Nagar, JP Nagar 7th Phase, Bengaluru, Karnataka 560078`; grievance officer Mr. Shailesh; `support@mallucupid.com` / `info@mallucupid.com`; `+91-9581150441`.

### Creator auth

| Route | Page |
|-------|------|
| `/login` | Creator email/password |
| `/signup` | Username + email + password → OTP |
| `/verify-otp` | 6-digit OTP (45s resend) |
| `/forgot-password` | Email → OTP → new password |
| `/onboarding` | Avatar, name, bio (post-signup) |

Signup username: debounced live check via `GET /username-check?u=`; format + uniqueness enforced in API and DB (`009`).

### Fan (consumer) auth

| Route | Page |
|-------|------|
| `/userlogin` | Fan login (`?redirect=` back to public slug) |
| `/usersignup` | Fan signup (name + email + password) |
| `/userotpverify` | Fan OTP |
| `/userpasswordreset` | Fan password reset |

### Admin

| Route | Page |
|-------|------|
| `/adminlogin` | Admin login (no signup/reset) |
| `/admin{uuid}` | Admin dashboard (matched before username routes) |

### Shared authenticated

| Route | Page |
|-------|------|
| `/view/:postId` | Post media viewer |
| `/view/exclusive/:postId` | Exclusive-room post viewer |
| `/exclusive/:roomId` | Room gallery / entry paywall |
| `/report/:postId` | Report a post |
| `/payment-confirmation` | Post-unlock payment poll / confirm |
| `/user-inbox` | Fan inbox |
| `/user-notifications` | Fan notifications |
| `/user-chat/:conversationId` | Fan chat |

### Legacy redirects

`/dashboard`, `/edit-profile`, `/create-post`, `/verification` → session username → `/{username}/…`.

### Creator app (`/:username` + `CreatorLayout`)

Mobile header: brand + messenger + sign-out.  
Mobile navbar: Profile · Notifications · + New post (Photo/Video) · Wallet · Help.  
Desktop sidebar: Inbox, Wallet, Verification, Help, Sign Out.

| Nested route | Page |
|--------------|------|
| `/` (index) | Dashboard — profile, badge, stats, Exclusive highlights, photo/video grid |
| `edit-profile` | Edit name, bio, avatar, location, socials (username read-only) |
| `create-post` | Free/paid photo or video post |
| `exclusive/new` | Create Exclusive Room |
| `exclusive/:roomId` | Room view / manage |
| `exclusive/:roomId/edit` | Edit room name/fee |
| `exclusive/:roomId/create` | Post into a room |
| `post/:postId` | Media viewer |
| `post/:postId/edit` | Edit caption / paid price |
| `post/:postId/report` | Report post |
| `verification` | ID verification (badge submit / status) |
| `wallet` | Earnings, sales, bank details, withdraw |
| `help` | Support tickets |
| `notifications` | Creator notifications |
| `inbox` | Messaging inbox |
| `chat/:conversationId` | Chat thread |

### Public creator profile

- Slug `username` + 5-digit serial (e.g. `/founder00152`) → `PublicProfilePage`.
- Mobile-only gate (UA + touch + coarse pointer). Desktop sees “Mobile only”.
- Layout: logo + Login, gradient cover, avatar, “Hi, I'm …”, posts + subscribers, Follow + Chat, Exclusive highlights, photo/video grid, bottom “Be a creator / Start Earning”.
- When creator badge inactive: `content_locked` banner; posts/rooms empty for fans.
- PWA: `manifest.webmanifest` + service worker; Install uses `beforeinstallprompt` or A2HS instructions.

Plain `/:username`: creator app; admins → `/admin{id}`; fans → `/user-inbox`. Unknown → `/`.

---

## 4. Key UI features

| Feature | Behavior |
|---------|----------|
| **Verified badge** | Instagram-style check when `is_verified` and status `verified` (dashboard, public profile, verification page) |
| **Exclusive Rooms** | Up to 4 highlight circles; monthly entry ≥ ₹10; 30-day access; room posts have no per-post price |
| **Posts** | Free or paid (min ₹10); signed private media; likes + unique views; crop 4:5 photos / 9:16 video |
| **Wallet** | Lifetime + 24h-held withdrawable; platform fee from API; bank/UPI payout; min withdraw ₹100 |
| **Messaging** | Requests → All chats; text/media; view-once; block/report; delete for me/both |
| **Notifications** | like, purchase, follow, request, accept; mark-all-read; Resend email on follow / paid unlock |
| **Admin** | Overview, Users, Posts, Verification, Wallet & Payments, Settlements, Withdrawals, Help, Reports |
| **SEO** | Landing `SeoSection` + `index.html` meta |
| **Secure media** | Short-lived signed URLs after access checks; anti-download UX (browser-limited) |

---

## 5. Backend API catalog (`auth` edge function)

### Admin

| Route | Method | Purpose |
|-------|--------|---------|
| `admin-login` | POST | Admin login → `/admin{id}` |
| `admin/stats` | GET | Overview counts |
| `admin/users` | GET | List accounts |
| `admin/user` | GET | User detail + earnings |
| `admin/posts` | GET | List posts |
| `admin/post` | GET | View signed post media |
| `admin/posts/delete` | POST | Hard-delete post + storage |
| `admin/support-tickets` | GET | List tickets |
| `admin/support-tickets/update` | POST | Status + admin reply |
| `admin/reports/posts` | GET | Post reports |
| `admin/reports/users` | GET | User reports |
| `admin/withdrawals` | GET | Withdrawal queue |
| `admin/withdrawals/complete` | POST | Mark paid + txn id + slip |
| `admin/payments` | GET | Paid posts + exclusive entries |
| `admin/settlements` | GET | Per-creator earnings vs settled |
| `admin/verifications` | GET | Verification queue |
| `admin/verification` | GET | Detail + signed ID docs |
| `admin/verifications/update` | POST | `approve` / `suspend` / `restore` / `reject` |
| `admin-wallet-withdraw` | POST | Ops accept/reject/paid (`AUTH_ADMIN_SECRET`) |

### Creator verification

| Route | Method | Purpose |
|-------|--------|---------|
| `creator-verification` | GET | Badge / application status |
| `creator-verification/upload-urls` | POST | Signed ID front/back uploads (blocked if already verified or pending) |
| `creator-verification/submit` | POST | Submit KYC (auto / pending rules) |

### Auth & session

| Route | Method | Purpose |
|-------|--------|---------|
| `login` | POST | Creator login |
| `signup` / `verify` / `resend` | POST | Creator signup OTP |
| `forgot` / `reset` | POST | Creator password reset OTP |
| `user-login` | POST | Fan login |
| `user-signup` / `user-verify` / `user-resend` | POST | Fan signup OTP |
| `user-forgot` / `user-reset` | POST | Fan password reset |
| `logout` | POST | Clear cookies |
| `session` | GET | Current user |
| `username-check` | GET | Availability |

OTPs: AES-GCM sealed; rate limits + attempt caps; unused prior OTPs invalidated; Resend failures → 502 and cleanup.

### Profile / posts / media

| Route | Method | Purpose |
|-------|--------|---------|
| `profile` | GET/POST | Profile + posts/rooms; update onboarding fields |
| `post-upload-urls` | POST | Signed post media uploads (requires verified badge) |
| `posts` | POST | Create post (requires verified badge) |
| `post` | GET | Detail + access + signed media; unique non-owner view |
| `secure-media` | GET | Access-gated media redirect |
| `post-like` | POST | Toggle like (blocked if creator content locked) |
| `post-update` / `post-delete` | POST | Edit/delete own post |
| `post-report` | POST | Report post |
| `post-checkout` | POST | Razorpay order for paid unlock |
| `post-verify-payment` | POST | HMAC verify → permanent unlock |
| `post-payment-status` | GET | Poll unlock status |
| `razorpay-webhook` | POST | HMAC reconcile captured payments |

### Exclusive rooms

| Route | Method | Purpose |
|-------|--------|---------|
| `exclusive-rooms` | GET/POST | List / create (max 4; verified badge) |
| `exclusive-rooms/update` | POST | Name / fee |
| `exclusive-rooms/thumbnail-upload` | POST | Thumbnail signed URL |
| `exclusive-rooms/thumbnail-confirm` | POST | Confirm thumbnail |
| `exclusive-rooms/delete` | POST | Delete room |
| `exclusive-room` | GET | Room + posts + access (`post_count` only when locked) |
| `exclusive-room-upload-urls` | POST | Room post uploads |
| `exclusive-room-posts` | POST | Create room post |
| `exclusive-room-posts/delete` | POST | Delete room post |
| `exclusive-room-post` | GET | Single room post (access-gated) |
| `exclusive-room-checkout` | POST | Razorpay room entry |
| `exclusive-room-verify-payment` | POST | Verify → 30-day subscription |
| `exclusive-room-payment-status` | GET | Poll room access |

### Wallet / payout / support

| Route | Method | Purpose |
|-------|--------|---------|
| `payout-account` | GET/POST | Bank/UPI (masked last4 only on read) |
| `wallet` | GET | Balances, sales, withdrawals, fee preview |
| `wallet-withdraw` | POST | Request withdrawal (min ₹100; atomic RPC) |
| `support-tickets` | GET/POST | Help tickets |

### Social / messaging / notifications

| Route | Method | Purpose |
|-------|--------|---------|
| `public-profile` | GET | Public page by slug (`content_locked` when badge inactive) |
| `public-follow` | POST | Follow / unfollow |
| `notifications` | GET | Latest 100 + unread count |
| `notifications-read` | POST | Mark all read |
| `conversations` | GET/POST | Inbox / start chat |
| `conversation-accept` | POST | Accept request |
| `user-search` | GET | Find users |
| `messages` | GET/POST | Thread / send |
| `chat-upload-url` | POST | Chat media |
| `message-view-once` | POST | Single-use open |
| `message-delete` | POST | Delete me / both |
| `chat-delete` | POST | Clear conversation |
| `chat-block` | POST | Block / unblock |
| `chat-report` | POST | Report user |

### Disabled

- Edge function `welcome` → always **410**.

---

## 6. Feature systems (detail)

### 6.1 Creator verification badge (025–026)

**Schema:** `profiles.is_verified`, `verification_public_id`, `verification_status`; table `creator_verifications`; private bucket `verification-docs`; RPCs `creator_has_verified_badge`, `is_at_least_18`. Statuses: `unverified` | `pending` | `verified` | `suspended` | `rejected`. Column `auto_reverify_count`.

**Rules (backend-enforced)**

1. First submit (legal name, DOB ≥ 18, ID front+back paths `{userId}/front.*` / `{userId}/back.*`, terms) → **immediate verified badge** + 12-char alphanumeric public id.
2. Admin may **suspend** / **restore** / **reject**; pending 4th+ requests need **Approve**.
3. After suspend/reject: resubmits **1–3 auto-verify**; **4th+** → `pending` until admin. Further submit blocked while pending.
4. Badge inactive → fans cannot see posts / Exclusive Rooms (`content_locked`); like, checkout, media, room access return `content_locked` for non-owners.
5. Creators cannot create/update posts or Exclusive Rooms without an active badge (`verification_required`).

**UI:** `/{username}/verification` — upload %, pending wait state, success copy for live vs pending. Admin **Verification** tab — signed docs + Approve / Suspend / Restore / Reject.

### 6.2 Posts

- Migration `005`: `public_id` (12-char), `media_paths`, caption ≤200, paid ≥ ₹10, 1–15 images or 1 video.
- Private `post-media` bucket; 1h signed URLs only.
- Create flow: `post-upload-urls` → browser PUT (real %) → `posts`.
- Viewer: like, unique views, edit/delete (owner), report (non-owner), Razorpay unlock for paid.
- Dashboard: Instagram-style grid; paid tiles blurred + unlock CTA.

### 6.3 Exclusive Rooms (023–024)

- Max **4** rooms/creator; name 1–10 chars; entry fee ≥ ₹10; thumbnail; `sort_order` 0–3.
- Monthly subscription: pay → `expires_at` +30 days; statuses `created` / `paid` / `expired` / `cancelled`.
- One pending checkout per `(room_id, user_id)`.
- Locked response: **`post_count` only** — no captions/paths/IDs.
- Owner always has access. Wallet + admin payments include room fees. Creator email on exclusive entry (`kind: exclusive`).

### 6.4 Payments (Razorpay)

**A. Paid post unlock (one-time, permanent)**  
Checkout → Checkout.js → verify HMAC and/or webhook → `post_purchases.status = paid`. Confirmation page polls `post-payment-status`. Amount/currency/order matched server-side. Secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

**B. Exclusive room entry (monthly)**  
Same pattern against `exclusive_room_subscriptions`; renew after expiry.

**C. Creator withdrawals (manual bank transfer, not Razorpay Payouts)**  
Earnings = paid posts + exclusive entries. Withdrawable after **24h** hold. Min ₹100. Platform fee from `platform_config.withdrawal_fee_bps` (default **900 = 9%**); gross reserved, admin pays **net**. Flow: pending → admin accept → complete with txn id + optional slip (`admin-slips`).

### 6.5 Wallet & support

- `payout_accounts`: holder, 9–18 digit account, IFSC `AAAA0XXXXXX`, optional UPI.
- `support_tickets`: subject 3–120, message 10–1000, status open / in_progress / resolved, admin_reply.
- Atomic `request_wallet_withdrawal` RPC prevents double-spend.

### 6.6 Messaging

- Conversations: request/accepted; delete-for-me timestamps; blocks + user reports.
- Messages: body ≤2000; media; view-once (atomic single open); seen; delete me/both.
- Private `chat-media` bucket. Pending requests: initiator may send only the first message until accepted.
- Inbox tabs: All / Unread / Requests. Poll ~10s.

### 6.7 Notifications

- Types: `like`, `purchase`, `follow`, `request`, `accept`. Server-created only.
- Unlike retracts like notification. Self-actions never notify.
- Creator emails (Resend) on new follow and paid unlock / exclusive entry.

### 6.8 Admin console tabs

| Tab | Capabilities |
|-----|----------------|
| Overview | Users, creators, posts, open tickets, reports, pending withdrawals |
| Users | List + detail (role, email, posts, followers, earnings) |
| Posts | Browse, view media, permanent delete |
| Verification | Queue, signed ID front/back, approve / suspend / restore / reject |
| Wallet & Payments | Post unlocks + exclusive room payments |
| Creator Settlements | Total earned / settled / balance |
| Withdrawals | Accept → complete (txn + slip) or reject |
| Help | Ticket status + admin reply |
| Reports | Post reports + user reports |

---

## 7. Database migrations

| # | Summary |
|---|---------|
| 001 | `profiles` |
| 002 | `email_verifications` OTP |
| 003 | Public `avatars` bucket |
| 004 | Profile fields, follows, posts |
| 005 | Posts `public_id`, media paths, private media |
| 006 | `payout_accounts`, `support_tickets` |
| 007 | Likes, purchases, post reports |
| 008 | Messaging, blocks, user reports, chat media |
| 009 | Username format + case-insensitive unique |
| 010 | Notifications |
| 011 | `public_serial` (from 151) |
| 012 | `user_accounts` roles creator/user; fan follows |
| 013 | Purchase audit fields |
| 014 | Durable like/view counts + race-safe RPCs |
| 015 | RLS lockdown profiles/OTPs |
| 016 | Drop `is_private` |
| 017 | `wallet_withdrawals`, rate limits, revoke PostgREST leaks |
| 018 | Atomic withdraw RPC; storage lockdown |
| 019 | Follow notifications |
| 020 | Role **`admin`** |
| 021 | Withdrawal `accepted` + transfer proof; **24h hold**; `admin-slips` |
| 022 | `withdrawal_fee_bps` default 9%; fee/net helpers |
| 023 | Exclusive rooms, room posts, subscriptions |
| 024 | Exclusive audit: cancelled, one pending checkout, expire helper |
| 025 | Creator verification badge + docs bucket |
| 026 | Reverify rules: pending/rejected, `auto_reverify_count` |

All writes for protected data go through the edge function (service role). `anon` / `authenticated` PostgREST grants revoked on sensitive tables.

---

## 8. Storage buckets

| Bucket | Public? | Use |
|--------|---------|-----|
| `avatars` | yes | Profile avatars |
| `post-media` | no | Post + exclusive room media (signed) |
| `chat-media` | no | Messaging attachments |
| `verification-docs` | no | ID front/back |
| `admin-slips` | no | Withdrawal transfer proofs |

---

## 9. Security notes

- Cookie sessions; CORS via `AUTH_CORS_ORIGIN` (mallucupid.com + localhost for dev).
- Media never public except avatars; access checked then signed.
- Frontend is never trusted for prices, access, badge, or role.
- Rate limits on auth OTP, verification upload/submit, and related sensitive paths.
- Payout APIs never return full account numbers.
- Screenshot / PiP / download prevention is best-effort in browsers.

---

## 10. Quick route map (by audience)

**Creators:** signup → OTP → onboarding → verify badge → create posts / Exclusive Rooms → wallet withdraw → inbox.  
**Fans:** public slug → login/signup → follow / chat / unlock posts / enter rooms.  
**Admins:** `/adminlogin` → review verifications, posts, withdrawals, tickets, reports.
