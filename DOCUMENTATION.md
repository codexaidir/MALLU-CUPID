# MalluCupid Documentation

## UI Pages & Routing

The application uses URL-based pagination (React Router) with the following routes:

- **`/` (Landing Page)**
  - `Hero`, `HowItWorks`, `CommunityCTA`, and `Footer` sections.
  - Header: large brand logo (`BrandLogo` size `xl`), How it Works, Become a creator, Get Started → `/login`.
  - Footer: brand + short product blurb, nav links (How it works / Become a creator / Fan login / Contact), copyright, Privacy / Terms / Refund. No merchant-details address card.
- **`/login` (Login Page)**
  - Uses `Email` and `Password` (with eye icon to toggle visibility).
  - "Forgot Password?" link -> navigates to `/forgot-password`.
  - "Don't have an account? Sign up" link -> navigates to `/signup`.
  - Login action -> navigates to `/dashboard`.
- **`/signup` (Sign Up Page)**
  - Requires `Username`, `Email`, and `Password` (with eye icon).
  - Real-time username validation (debounced ~400ms) against the backend — never simulated:
    - Format: 6–25 characters; letters, numbers, `_` `.` `-` only; spaces forbidden.
    - `GET /username-check?u=` returns `{ available: true }` or `{ available: false, reason: 'taken'|'invalid', error }` from the DB (profiles + pending unverified signups), case-insensitive.
    - Taken message: **"Username already taken. Choose a different one."**
    - Username is never marked available until the backend confirms uniqueness. Sign Up stays disabled until then.
  - `POST /signup` and OTP `POST /verify` re-validate format + uniqueness before creating the auth user / profile. Migration `009` adds a case-insensitive unique index on `lower(username)` and a format CHECK constraint as the final DB-level defense.
  - Submit action -> navigates to `/verify-otp`.
- **`/verify-otp` (OTP Verification Page)**
  - 6-digit OTP input.
  - 45-second resend timer.
  - Submit action -> navigates to `/onboarding`.
- **`/onboarding` (Creator Onboarding Page)**
  - Collects additional profile information after successful signup.
  - Circular Profile Image upload with mock upload progress and image preview (500x500px aspect).
  - Read-only `Username` field.
  - `Name` text input.
  - `Bio` textarea with a maximum of 400 characters and live character counting.
  - Submit action -> navigates to `/dashboard`.
- **`/forgot-password` (Forgot Password Page)**
  - Requires `Email`, `OTP`, and `New Password`.
  - Simulates sending OTP and verifying it to set a new password.
  - Submit action -> navigates to `/dashboard`.
- **`/dashboard` (Creator Dashboard Page)**
  - Sidebar layout (fixed on desktop, hamburger menu drawer on mobile).
  - Sidebar contains links for Dashboard, Notifications, Wallet, Verification, and Sign Out.
  - Sign Out button triggers a confirmation dialog box.
  - Replaced welcome message with an Instagram-like profile header.
  - Profile header includes circular profile image, username, verification badge, and edit/share buttons.
  - Share Profile button opens a modal to copy the profile URL to the clipboard.
  - Displays post count and **subscribers** (follower count; "following" is not shown).
  - Shows display name and bio below stats.
  - Exclusive Rooms highlights row (Instagram-style circles; create up to 4 rooms).
  - Implemented an Instagram-like gallery tab bar (Grid, Video).
  - Replaced the placeholder with a responsive 3-column media grid supporting images and videos (indicated by a play icon) and hover states.
  - Gallery renders database posts only; empty database shows an empty state.

## Configuration & Architecture

- **Routing:** `react-router-dom` is used for client-side routing.
- **Styling:** Tailwind CSS is used globally. The color theme prominently features Pink/Rose and White combinations with clean BentonGrid-like UI designs and soft shadows.
- **Responsiveness:** Mobile responsive layout is enforced across all auth and dashboard pages.
- **Header in Auth Pages:** The auth pages share a common Layout wrapper that includes the site's Header.
- **Icons:** `lucide-react` is used for UI icons (Eye, EyeOff, etc.).

## Deployment

- **Frontend:** Deployed on AWS Amplify (region: ap-southeast-1).
- **Custom domain:** https://www.mallucupid.com
- **Backend:** Supabase With edge functions
- All secrets store on supabase server side and aws amplify environment variables, Never create a .env file

- **Supabase:** linked project `rytulzgsuzgicmpvrrxn`; migrations and edge function template added.

## Auth updates

- Signup OTP: stores `email_verifications`, sends 6-digit code via Resend; invalidates prior unused OTPs for same email.
- Email send failures return 502 with Resend error detail; orphan verification rows are deleted on send failure.
- `POST /resend` regenerates token and re-sends OTP for latest unused signup verification.
- Verify creates auth user + `profiles`, sets HttpOnly cookies; `POST /profile` updates onboarding fields from session cookie.
- Routes accept `/signup` and `/auth/signup` style (base URL: `VITE_AUTH_API_URL=.../functions/v1/auth`).
- Frontend paths: `/signup`, `/verify`, `/resend`, `/login`, `/session`, `/profile` (no double `/auth`).
- GoTrue error shape (`msg` / `error_code`) handled for login/forgot/reset.
- Migrations `001`/`002`/`003` applied on remote. Secrets set: AUTH_* keys, CORS for mallucupid.com.
- Resend OTP email delivery verified (`verification_sent` after valid `AUTH_RESEND_API_KEY`).

## Onboarding / Profile

- `profiles` table stores creator profile: `username`, `full_name` (display name), `bio`, `avatar_url`.
- Migration `003` creates public `avatars` storage bucket (5MB, jpg/png/webp/gif) and defaults full_name/bio to ''.
- `GET /profile` returns current user's profile (username auto-fetched from signup — read-only on onboarding).
- `POST /profile` requires `full_name` and `bio` (mandatory, bio <=400). Optional avatar via `avatar_base64` + `avatar_content_type`; uploaded to `avatars/{userId}/avatar.{ext}` (service role, upsert) and public URL saved to `avatar_url`. Existing `avatar_url` string also accepted.
- Onboarding page auto-fetches username, prefills existing values, uploads image to storage (not base64 in DB), enforces name+bio.
- Migration `004` adds profile fields (`location`, social URLs, gender, privacy), `follows`, and `posts`; applied remotely with RLS.
- `/edit-profile` loads/saves Supabase data and avatar storage only; no localStorage or mock profile values.
- `GET /profile` returns profile, latest posts, and exact DB counts for posts/followers/following.
- Dashboard profile, avatar, bio, location, gallery, and counts use this API; absent data renders empty/zero.

## Posts (create post workflow)

- Migration `005`: `posts` gains `public_id` (12-char alphanumeric, unique, generated on backend) and `media_paths text[]`; constraints enforce caption <=200 chars, paid price >=10 (free = 0), 1-15 images or exactly 1 video per post. Applied remotely.
- Private storage bucket `post-media` (500MB limit, jpeg/png/video-* MIME). Media is never public: it is served through 1-hour signed URLs generated by the edge function. Storage RLS restricts creators to their own `{user_id}/...` folder.
- `POST /post-upload-urls` (cookie auth): validates files (image: <=15, <=50MB each, jpg/jpeg/png; video: exactly 1, <=500MB, video/*), generates the 12-char post id, and returns signed upload URLs. The browser PUTs files directly to storage (real upload % progress, no base64 through the function).
- `POST /posts` (cookie auth): validates caption/price/paths, verifies files actually exist in storage, then inserts the post row.
- `GET /profile` decorates posts with `media_urls` (signed), `media_url` (first item), `media_count`, `public_id`, `like_count`, and `view_count`.
- Frontend `/create-post?type=photo|video`:
  - Photo: multi-select from device, carousel with left/right arrows, per-photo delete, add-more, react-easy-crop Instagram-style crop fixed at 4:5, exported at exactly 1080x1350 JPEG.
  - Video: one video, reels 9:16 preview; non-9:16 videos letterboxed on black background.
  - Caption (200 max with counter), Post Type dropdown Free/Paid, INR price input (min ₹10) with validation.
  - Uploading screen with % ring, then success animation (white/pink theme).
- Dashboard: desktop "New post" button + Photo/Video dropdown next to Edit/Share profile; mobile navbar + button opens the same Photo/Video drop box. Paid posts render heavily blurred with lock, "Exclusive Content", and "Unlock for ₹X" pill.
- `AUTH_CORS_ORIGIN` secret now includes localhost:3000/3001 for local development alongside mallucupid.com.
- End-to-end tested: API (signed upload -> PUT -> create -> profile) and browser (photo crop/post, video post, validations, mobile + desktop UI). Test posts and media were removed afterwards.

## Username URLs, mobile chrome, wallet & help

- Logged-in URLs are username-based: profile at `/<username>`, sub-pages at `/<username>/<page>` (edit-profile, create-post, verification, wallet, help, notifications, inbox). Legacy paths (`/dashboard`, `/edit-profile`, `/create-post`, `/verification`) redirect using the session's `user_metadata.username`.
- `CreatorLayout` wraps all `/:username` routes: requires a session, verifies the URL username against the DB profile (redirects to the canonical one, preserving sub-path), and renders the fixed mobile header + navbar on every logged-in page.
- Edge function `POST /profile` now syncs a changed username into auth `user_metadata` (admin API) so URL building stays correct.
- Mobile header (fixed top): brand icon on the left, messenger + sign-out on the right.
- Mobile navbar (fixed bottom), left to right: Profile, Notifications, + New post (Photo/Video drop box), Wallet, Help.
- Dashboard: settings icon next to the username removed (Edit profile button remains); gap between header and profile section tightened; desktop sidebar links now go to Inbox, Wallet, Verification, and a new Help entry.
- Migration `006`: `payout_accounts` (bank details, RLS read-own) and `support_tickets` (subject 3-120, message 10-1000, status open/in_progress/resolved, admin_reply, RLS read-own).
- New endpoints (cookie auth): `GET/POST /payout-account` (validates account holder, 9-18 digit account number, IFSC `AAAA0XXXXXX`, optional UPI) and `GET/POST /support-tickets`.
- Wallet page: lifetime earnings + withdrawable balance (sales paid ≥24h ago minus withdrawals), platform withdrawal fee shown from API, content sales (posts + exclusive room entries), bank details form persisted to DB (masked display + edit), withdraw disabled below ₹100 minimum.
- Help page: create support tokens to contact admin, list with status badges and admin reply display.
- Notifications and Inbox pages have clean empty states pending those systems.

## Media viewer, likes, edit/delete/report & paid unlock (Razorpay)

- Migration `007`: `post_likes` (PK post+user), `post_purchases` (one row per post+user, `status created/paid`, Razorpay order/payment ids, amount, `paid_at` — one-time, no expiry), `post_reports` (post id + public id, owner id/username, reporter id/username, reason, details <=750, timestamp). RLS: likes readable, purchases/reports readable by owner-user only; all writes go through the edge function (service role).
- Migration `014`: durable `like_count` and unique-account `view_count` columns on posts, a `post_views` table keyed by post+viewer, database triggers that keep counters synchronized, and service-role-only race-safe RPCs for likes, follows, and views. Reopening a post from the same account does not inflate its view count, and a creator viewing their own post is excluded.
- New endpoints (cookie auth, all server-side verified — the frontend is never trusted):
  - `GET /post?id=<public_id>`: records a unique non-owner view and returns post + owner info, `like_count`, `view_count`, `liked_by_me`, `is_owner`, `has_access`. Signed `media_urls` are only included when access is granted (owner, free post, or a recorded `paid` purchase).
  - `POST /post-like`: atomically toggles a real database like and returns the synchronized count. Locked paid content cannot be liked before purchase.
  - `POST /post-update`: owner-only; edits caption (<=200), type free/paid, price (>=10). Updates the existing row — post id / public id never change.
  - `POST /post-delete`: owner-only; removes storage media then the row (likes/purchases/reports cascade).
  - `POST /post-report`: non-owners only; validates reason against the fixed list and details <=750; stores reporter + owner usernames/uuids, post ids, and timestamp.
  - `POST /post-checkout`: creates a Razorpay order (amount from the DB price, INR) and a pending `post_purchases` row; returns `already_unlocked` for owners/free/already-paid. Requires `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` secrets — returns 503 "Payments are not configured yet" until they are set.
  - `POST /post-verify-payment`: verifies the Razorpay HMAC-SHA256 signature (`order_id|payment_id`) against the pending purchase row for that user+post, then marks it `paid`. Access is permanent after that.
- Frontend routes under `/<username>`: `post/:postId` (media viewer), `post/:postId/edit`, `post/:postId/report`.
- Media viewer: full-screen black overlay; back arrow, owner avatar+username, 3-dot menu (owner: Edit/Delete with confirm dialog; others: Report), like heart + synchronized like count, unique view count, caption, Free/₹price chip. Images: swipe arrows, x/y counter, dots. Videos: tap to play/pause, seek bar, current/total duration. Locked paid posts show the unlock screen; "Unlock for ₹X" opens Razorpay Checkout and re-fetches access only after server-side verification.
- Edit post page: media preview, caption (200 max + counter), Free/Paid dropdown, INR amount (min ₹10) — saves via `/post-update` with the same public id.
- Report post page: reason dropdown (8 fixed reasons), additional details textarea (750 max + counter), submit -> success state. Owners are redirected away.
- Dashboard grid: whole card navigates to the viewer (paid card "Unlock" button too); grid videos are muted previews with a center play icon; the gap between the grid/video tab separator and the posts was removed.
- End-to-end tested via API (owner access, non-owner paid lock, simulated purchase unlock, like toggle, edit validation + same-id save, cross-user delete rejection, report row contents, storage cleanup on delete) and in the browser (viewer, carousel, like, menu, delete dialog, edit save/validation, owner report redirect). Test users/posts/reports/purchases cleaned up.

## Messaging (inbox + chat)

- Migration `008`: `conversations` (ordered user pair unique, `created_by`, `status pending/accepted` for the request flow, per-user `cleared_a/cleared_b` for delete-for-me), `messages` (body <=2000, `media_path/media_type`, `is_once` + `viewed_at` for view-once, `seen_at`, `deleted_for uuid[]`, `deleted_for_all`), `user_blocks`, `user_reports` (reporter + reported usernames/uuids, conversation id, reason, details <=750, timestamp). RLS enabled with no public policies — everything goes through the edge function. Private `chat-media` bucket (100MB, image/video) served via signed URLs only.
- Endpoints (cookie auth): `GET/POST /conversations` (list with creator profile or consumer account identity, preview, unread count, request flag / race-safe find-or-create by username), `POST /conversation-accept`, `GET /user-search?q=`, `GET /messages` (also marks incoming as seen), `POST /messages` (recipient reply auto-accepts a request; blocked users can't send in either direction), `POST /chat-upload-url`, `POST /message-view-once` (recipient only, single use — marked viewed atomically before the URL is issued, second call gets 410), `POST /message-delete` (mode `me` appends to `deleted_for`; mode `both` only for own messages, wipes body + media), `POST /chat-delete` (mode `me` sets the per-user cleared timestamp; mode `both` removes media, conversation, and messages), `POST /chat-block`, `POST /chat-report`.
- Inbox (`/<username>/inbox` for creators, `/user-inbox` for consumer accounts): search box on top, tabs All chats / Unread (n) / Requests (n). The first message from a new user lands in Requests for the recipient; accepting (or replying) moves it to All chats. Rows show avatar, name, preview, time (h:mm / Yesterday / Nd / date) and rose unread badges. Searching also finds users by username to start a new chat. Polls every 10s.
- Chat page (`/<username>/chat/<id>` for creators, `/user-chat/<id>` for consumers): full-screen (own page, no app header/mobile navbar), back button top-left, peer avatar/name, audio + video call icons (UI placeholders for later), and a 3-dot menu with Block/Unblock user, Report user (reason + details modal), and Delete chat (for me / for both). Request banner with Accept/Delete for incoming requests. Bubbles have date separators, per-message time, and Sent/Seen status on own messages. Long-press selects messages (multi-select) for Delete for me / Delete for everyone (everyone only when all selected are yours). Composer: photo/video attach with a "View once" checkbox and upload %, 40-emoji picker, Enter to send.
- View-once media renders as a "Tap to view" pill for the recipient, opens full screen exactly once, then shows "Opened" on both sides. Normal media opens in a full-screen viewer. No download/forward affordances: context menu blocked, `controlsList="nodownload"`, no PiP, images non-draggable. (True screenshot blocking is not technically possible in a web browser.)
- Tested end-to-end via API (request -> unread -> seen -> reply auto-accept, view-once single use, delete for me vs both, block send rejection both ways, report row contents, clear-for-me hiding the chat only for that user, delete-for-both wiping storage + rows) and in the browser (inbox tabs, request accept, emoji send, chat UI). All test users/conversations cleaned up.

## Notifications

- Migration `010`: `notifications` table — recipient `user_id`, `actor_id`, `type` (`like` / `purchase` / `follow` / `request` / `accept`), optional `post_id`/`post_public_id` (cascade on post delete) and `conversation_id` (cascade on conversation delete), `read` flag, timestamp. Partial unique indexes: one `like` per actor/post, one `follow` per actor. RLS enabled with no public policies — all access via the edge function.
- Events are created server-side (never by the frontend): liking a post notifies the creator (unliking retracts it), a verified paid unlock notifies the creator, a new message request notifies the recipient, and accepting a request (via the Accept button or by replying) notifies the requester. Users are never notified about their own actions.
- Creator **email** notifications (Resend, backend-only): when someone newly follows a creator, or when a paid post unlock is verified and recorded, MalluCupid emails the creator's **auth signup email** with the MalluCupid logo, a greeting, the actor username/name, and the event message. Unfollows do not email. Failures are logged and never block the API response. Uses existing `AUTH_RESEND_API_KEY` / `AUTH_EMAIL_FROM`; optional `AUTH_PUBLIC_APP_URL` for the logo host (defaults to the first CORS origin).
- Endpoints (cookie auth): `GET /notifications` (latest 100, decorated with actor username/name/avatar and post caption, plus `unread_count`), `POST /notifications-read` (marks all as read). `POST /public-follow` creates a `follow` notification for the creator; paid unlocks create `purchase` via `recordPaidPurchase`.
- Page (`/<username>/notifications`): grouped **New** / **Today** / **Earlier**. Types: rose heart = like, violet + = follow, amber ₹ = paid unlock, sky + = request, emerald check = accept. Tapping opens post (like/unlock), inbox (follow), or chat (request/accept).
- Tested end-to-end via API (like -> notification, request -> notification, accept -> notification for requester, reply auto-accept -> notification, mark-all-read, self-like produces nothing, unlike retracts) and in the browser (desktop + mobile viewport). Seeded test data removed afterwards.

## Immutable usernames + edit-profile cleanup

- Usernames are permanent once created at signup. `POST /profile` never updates the username: if a request includes a username different from the current one it returns 400 "Username cannot be changed" (backend-enforced, works even if the frontend is bypassed). The username -> auth metadata sync on profile update was removed as unnecessary.
- Edit Profile page: username field is read-only (grayed, lock icon, "Usernames are permanent and cannot be changed.") and is not sent on save — this also fixes the false "Username already taken" error that appeared when changing the avatar.
- Private accounts removed: migration `016` drops `profiles.is_private`; API/types no longer accept it.

## Public creator pages (guest access, mobile only)

- URL: `/<username><5-digit serial>` (e.g. `/founder00152`). Migration `011` adds `public_serial` to profiles — a permanent unique number from a sequence starting at 151, backfilled in signup order and auto-assigned to new signups. Routing: a slug ending in 5 digits renders the public page; everything else (including the logged-in user's own username) stays on the creator app.
- Mobile-only gate: layered device detection (mobile user agent AND touch points AND coarse primary pointer, re-checked on resize/orientation change). Desktop visitors see a "Mobile only" block screen. Note: client-side detection is best-effort; a determined user with devtools emulation can bypass it, which is the browser-platform limit.
- Guest endpoint `GET /public-profile?slug=` (no auth): validates the slug (serial lookup + exact username prefix match, 404 otherwise) and returns profile (username, name, avatar, bio, serial), stats (post count + follower/subscriber count, no following), exclusive rooms summary for highlights, and up to 60 posts with live like/view counts. Paid posts never include a media URL for guests — only `is_paid` + price; free posts get a 1h signed preview of their first media.
- Page layout: fixed header (logo + Login), **gradient-only cover** (`from-rose-400 via-rose-500 to-amber-400`), avatar, username/name, posts + subscribers, bio, Follow + Chat (guests → `/userlogin?redirect=...`), Exclusive Rooms highlights, sticky photo/video tabs, Instagram-style 3-column grid (locked paid tiles, play badge for videos), and bottom **Be a creator / Start Earning** → `/`.
- Tested as a guest via API (valid slug, wrong prefix, unknown serial, malformed slug) and in the browser with iPhone emulation (gate blocks desktop, page renders on mobile, login/follow/chat, photo/video tabs, locked paid tiles).

## Consumer users vs creators + redesigned public page

- Migration `012`: `user_accounts` table with authoritative `role` (`creator` | `user`), name/email; existing profiles backfilled as creators. `follows.follower_id` now references `auth.users` so consumers can follow creators without needing a creator profile.
- Creator auth (`/login`, `/signup`, `/verify-otp`) stays creator-only. `/login` rejects user-role accounts with **"You don't have a creator account"**. New creator signups write `role: creator` into both auth metadata and `user_accounts`.
- Consumer auth pages: `/userlogin`, `/usersignup`, `/userotpverify`, `/userpasswordreset`. Endpoints: `POST /user-login`, `/user-signup`, `/user-verify`, `/user-resend`, `/user-forgot`, `/user-reset`. Signup = email + name + password → 6-digit OTP → session + return to `?redirect=<public slug>`. Reset = email → OTP → new password → same redirect. Follow / Chat / paid post open require login and send guests to `/userlogin?redirect=...`.
- Public page redesign (reference link-in-bio layout): gradient cover (not a media banner), Install PWA button, Login/Follow overlays, avatar, "Hi, I'm …", posts/subscribers, Follow + Chat Now, Exclusive Rooms highlights, Exclusive Content photo/video tabs, then a large bottom **"Be a creator / Start Earning"** section that sits well below the posts (no overlay). PWA: `manifest.webmanifest`, icon, service worker; Install uses Chrome `beforeinstallprompt` when available, otherwise shows Android/iOS Add-to-Home-Screen instructions.
- Guest content routes: `/view/:postId` (media viewer), `/view/exclusive/:postId` (exclusive media), `/user-inbox`, `/user-notifications`, and `/user-chat/:conversationId` for logged-in consumers outside the creator app shell.

## Live Razorpay paid-post reconciliation

- Razorpay live credentials are stored only as Supabase Edge Function secrets (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). The secret is never returned to or bundled in the frontend; checkout returns only the publishable key and server-created order data.
- Clicking a paid tile on a public creator page first calls the authenticated backend `GET /post`. Owners and users with a permanent `post_purchases.status='paid'` row open `/view/:postId` immediately. Unpaid users call `POST /post-checkout`, which creates or safely reuses the same Razorpay order and opens the real Razorpay Checkout.
- Migration `013` adds purchase audit fields: `creator_id`, `amount_paise`, `provider`, and `verified_at`, while the existing unique `(post_id,user_id)` enforces one permanent purchase record per user/post.
- Razorpay callback goes to `/payment-confirmation?post=&order=`. The page verifies the HMAC callback server-side, then polls `GET /post-payment-status`. The backend independently fetches Razorpay payment/order data and validates order ID, captured status, INR currency, and exact immutable amount before granting access.
- If the browser callback is lost after debit, the confirmation page, `GET /post-payment-status`, and `POST /razorpay-webhook` (HMAC with `RAZORPAY_WEBHOOK_SECRET`) reconcile captured payments. An authorized/processing payment shows **Confirmation pending / Do not pay again**. Purchase recording is atomic/idempotent.

- Brand assets: logo `https://res.cloudinary.com/dsamz0zji/image/upload/v1784680966/mallucupidlogo_a44gud.png`; app icon `https://res.cloudinary.com/dsamz0zji/image/upload/v1784680970/appicon_n1we3u.png` (headers, footer, PWA, emails, favicon).
- Legal pages: `/terms-and-conditions`, `/privacy-policy`, `/refund-policy`, `/contact-us`. MalluCupid platform terms (creators, paid unlocks, exclusive rooms, Razorpay). Contact: company address `456, Gautam Nagar, JP Nagar 7th Phase, Bengaluru, Karnataka 560078`; grievance officer Mr. Shailesh (Kothnur Main Rd / JP Nagar 560076); support `support@mallucupid.com` / `info@mallucupid.com`; phone `+91-9581150441`.

## Wallet / auth / media hardening (017–018)

- Migration `017`: `wallet_withdrawals` + `auth_rate_limits`; revoke PostgREST grants on posts/likes/views/follows/purchases/payout/tickets/reports; drop public SELECT policies that leaked `media_paths`.
- Migration `018`: atomic `request_wallet_withdrawal` + `wallet_lifetime_paise` RPCs; drop authenticated `post-media` storage CRUD policies (signed URLs / service role only); revoke messaging/notifications/user_accounts PostgREST grants.
- `GET /wallet`: lifetime from paid post unlocks + exclusive room entries; withdrawable via 24h hold RPC; sales list includes both kinds; fee bps + masked bank details.
- `POST /wallet-withdraw`: min ₹100; atomic RPC prevents double-spend races; creates `pending` withdrawal.
- `POST /admin-wallet-withdraw`: ops path with `AUTH_ADMIN_SECRET` (`Authorization: Bearer …` or `x-admin-secret`) to mark pending withdrawals `paid`/`rejected`.
- Media: authenticated JSON APIs return short-lived signed storage URLs after access checks (no cross-origin cookie required for `<img>`/`<video>`). `/secure-media` remains as a fallback redirect.
- Consumer OTP (`/user-verify`, `/user-reset`, `/user-resend`): rate limits + attempt bumps (same model as creator verify).
- `POST /razorpay-webhook`: HMAC (`RAZORPAY_WEBHOOK_SECRET`) → records captured purchases when the browser callback is lost.
- Fan notifications: `/user-notifications` (same page as creator notifications). Inbox/report surfaces errors and redirects on 401.
- Pending chat requests: initiator may send only the first message until accepted.
- Payout APIs never return full account numbers (masked + last4 only).

## Auth / security hardening (015–016)

- Migration `015`: RLS on `profiles` + `email_verifications`; OTP lookup index.
- Migration `016`: drop unused `profiles.is_private`.
- OTP passwords AES-GCM sealed; crypto OTP; verify requires email+token; attempt cap.
- Creator `/forgot`+`/reset` use 6-digit OTP (`creator_reset`).
- `welcome` edge function returns 410. Verification: live payout API; KYC not enabled.
- Consumer report: `/report/:postId`. Creator OTP verify refreshes session.

## Admin console

- Migration `020`: `user_accounts.role` includes `admin`.
- Migration `021`: 24h withdrawal hold (`wallet_withdrawable_paise`); withdrawal statuses `pending`/`accepted`/`paid`/`rejected`; transfer proof fields + `admin-slips` bucket.
- Login: `https://www.mallucupid.com/adminlogin` (email + password only; no signup/reset). Role-gated: only `admin` accounts may enter.
- Dashboard URL: `https://www.mallucupid.com/admin<admin-user-uuid>` (matched before `/:username` so UUID routes are not treated as usernames). Tabs: Overview, Users (profile detail), Posts (view/delete media), Wallet & Payments (post unlocks **and** exclusive room entries), Creator Settlements, Withdrawals (view/accept/complete with txn ID + slip), Help, Reports.
- Creators can withdraw only from sales paid ≥24 hours ago.
- Bootstrap admin: `node scripts/create-admin-user.mjs` (requires `SUPABASE_SERVICE_ROLE_KEY`).

## Withdrawal platform fee (022)

- Migration `022`: `platform_config.withdrawal_fee_bps` (default **900** = 9%). Fee is never hardcoded in the frontend.
- SQL helpers (service role): `platform_withdrawal_fee_bps`, `calc_withdrawal_platform_fee_paise`, `calc_withdrawal_net_payout_paise`.
- On withdraw: **gross** amount is reserved from the wallet; admin transfers **net** (`net_payout_paise`). Wallet UI and admin withdrawal views show fee + net from the API.

## Exclusive Rooms (023–024)

Instagram-highlights style rooms with a **monthly entry fee** (Razorpay). Paying grants **30 days** of access to that room’s gallery. Room posts have **no per-post price** — access is entirely via the room subscription.

### Schema

- Migration `023`:
  - `exclusive_rooms` — max **4 per creator** (trigger `exclusive_room_limit`); name 1–10 chars; `entry_fee_paise` ≥ ₹10; `thumbnail_path`; `sort_order` 0–3 unique per creator.
  - `exclusive_room_posts` — caption, `media_type` image/video, `media_paths`, unique `public_id`.
  - `exclusive_room_subscriptions` — Razorpay order/payment ids, `amount_paise`, `status`, `expires_at` (paid → +30 days).
  - RLS: revoke from `anon`/`authenticated`; **service_role only**. Media under `post-media` at `{user_id}/exclusive/{room_id}/...`.
- Migration `024`:
  - Statuses: `created` / `paid` / `expired` / `cancelled`.
  - Unique pending checkout: one `(room_id, user_id)` where `status='created'`.
  - `expire_exclusive_subscriptions()` housekeeping helper.

### Backend (edge function `auth`)

- Rooms: `GET/POST /exclusive-rooms`, `GET /exclusive-room`, `POST /exclusive-rooms/update`, `POST /exclusive-rooms/delete`, thumbnail upload/confirm.
- Posts: `POST /exclusive-room-upload-urls`, `POST /exclusive-room-posts`, `GET /exclusive-room-post`, `POST /exclusive-room-posts/delete`.
- Payments: `POST /exclusive-room-checkout`, `POST /exclusive-room-verify-payment`, `GET /exclusive-room-payment-status`.
- Webhook + payment-status reconcile **match Razorpay amount** to the subscription row; stale fee / amount mismatch cancels or ignores pending orders (same hardening pattern as paid posts).
- Locked rooms (no active access): response includes **`post_count` only** — no captions, media paths, or post IDs.
- Active access via RPC `has_active_exclusive_access`. Owner always has access.
- Wallet lifetime / withdrawable and admin payments include paid exclusive subscriptions. Creator email on exclusive entry uses Resend (`kind: exclusive`).

### Frontend routes

- Creator app: `/<username>/exclusive/new`, `/<username>/exclusive/:roomId`, `/<username>/exclusive/:roomId/edit`, `/<username>/exclusive/:roomId/create`.
- Fan / shared: `/exclusive/:roomId` (auth required); media `/view/exclusive/:postId`.
- UI: `ExclusiveHighlightsRow` on dashboard + public profile (lock badge when locked); room page with owner Edit / Post / Delete controls on the fan route when the viewer is the creator; checkout → Razorpay → verify → gallery.

## Creator verification badge (025–026)

- Migration `025`: `profiles.is_verified`, `verification_public_id`, `verification_status`; table `creator_verifications`; private bucket `verification-docs`; RPC `creator_has_verified_badge`.
- Migration `026`: statuses include `pending`/`rejected`; `auto_reverify_count` tracks post-suspension auto re-verifies.
- **Rules (backend-enforced):**
  1. First submit → **immediate verified badge** + 12-char alphanumeric `public_id`.
  2. Admin may **suspend** / **restore** / **reject** after review; pending requests need **Approve**.
  3. After suspend/reject: resubmits **1–3 auto-verify**; **4th+** → `pending` (“badge request on preview”) until admin approves. While pending, further submits are blocked.
  4. While badge inactive (`suspended` / `pending` / `rejected` / unverified): **public posts and Exclusive Rooms are locked** (empty public feed, `content_locked`, post/room/checkout/media 403 for non-owners).
  5. Creators cannot create/update posts or Exclusive Rooms without an active badge.
- Creator UI: `/<username>/verification` (upload %, ID front/back, terms, pending waiting state).
- Admin tab: list + review signed IDs; Approve / Suspend / Restore / Reject.
- Endpoints: `GET/POST creator-verification*`, `GET/POST admin/verifications*`; rate limits on upload/submit.

- Supabase project ref: `rytulzgsuzgicmpvrrxn`.
- Apply migrations: `npx supabase db push` (linked project; password via CLI prompt or flag).
- Deploy auth function: `npx supabase functions deploy auth --no-verify-jwt --project-ref rytulzgsuzgicmpvrrxn`.
- Secrets live only in Supabase / Amplify — never commit a `.env` file.


