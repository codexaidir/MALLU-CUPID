# MalluCupid Documentation

## UI Pages & Routing

The application uses URL-based pagination (React Router) with the following routes:

- **`/` (Landing Page)**
  - `Hero`, `HowItWorks`, `CommunityCTA`, and `Footer` sections.
  - Header with a "Get Started" button leading to `/login`.
- **`/login` (Login Page)**
  - Uses `Email` and `Password` (with eye icon to toggle visibility).
  - "Forgot Password?" link -> navigates to `/forgot-password`.
  - "Don't have an account? Sign up" link -> navigates to `/signup`.
  - Login action -> navigates to `/dashboard`.
- **`/signup` (Sign Up Page)**
  - Requires `Username`, `Email`, and `Password` (with eye icon).
  - Implements an Instagram-model username setup:
    - Real-time debounced validation (checks format: minimum 6 chars, maximum 25, no spaces allowed, alphanumeric and icons/special chars permitted).
    - Simulates availability check (e.g., 'admin', 'root', 'mallucupid_creator', 'test' are taken).
    - Visual feedback with spinners and check/cross icons.
    - Disables submit until a valid and available username is chosen.
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
  - Displays post count and follower count.
  - Shows display name and bio below stats.
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
- `GET /profile` decorates posts with `media_urls` (signed), `media_url` (first item), `media_count`, `public_id`.
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
- Mobile header (fixed top): logo only on the left (no "Creator Hub" text), messenger icon on the right -> `/<username>/inbox`.
- Mobile navbar (fixed bottom), left to right: Profile, Notifications, + New post (Photo/Video drop box), Wallet, Help.
- Dashboard: settings icon next to the username removed (Edit profile button remains); gap between header and profile section tightened; desktop sidebar links now go to Inbox, Wallet, Verification, and a new Help entry.
- Migration `006`: `payout_accounts` (bank details, RLS read-own) and `support_tickets` (subject 3-120, message 10-1000, status open/in_progress/resolved, admin_reply, RLS read-own).
- New endpoints (cookie auth): `GET/POST /payout-account` (validates account holder, 9-18 digit account number, IFSC `AAAA0XXXXXX`, optional UPI) and `GET/POST /support-tickets`.
- Wallet page: balance ₹0 (no transactions system yet), content sales/lifetime earnings stats, bank details form persisted to DB (masked display + edit), withdraw disabled below ₹100 minimum, sales empty state.
- Help page: create support tokens to contact admin, list with status badges and admin reply display.
- Notifications and Inbox pages have clean empty states pending those systems.

## Media viewer, likes, edit/delete/report & paid unlock (Razorpay)

- Migration `007`: `post_likes` (PK post+user), `post_purchases` (one row per post+user, `status created/paid`, Razorpay order/payment ids, amount, `paid_at` — one-time, no expiry), `post_reports` (post id + public id, owner id/username, reporter id/username, reason, details <=750, timestamp). RLS: likes readable, purchases/reports readable by owner-user only; all writes go through the edge function (service role).
- New endpoints (cookie auth, all server-side verified — the frontend is never trusted):
  - `GET /post?id=<public_id>`: returns post + owner info, `like_count`, `liked_by_me`, `is_owner`, `has_access`. Signed `media_urls` are only included when access is granted (owner, free post, or a recorded `paid` purchase).
  - `POST /post-like`: toggles a like, returns new count.
  - `POST /post-update`: owner-only; edits caption (<=200), type free/paid, price (>=10). Updates the existing row — post id / public id never change.
  - `POST /post-delete`: owner-only; removes storage media then the row (likes/purchases/reports cascade).
  - `POST /post-report`: non-owners only; validates reason against the fixed list and details <=750; stores reporter + owner usernames/uuids, post ids, and timestamp.
  - `POST /post-checkout`: creates a Razorpay order (amount from the DB price, INR) and a pending `post_purchases` row; returns `already_unlocked` for owners/free/already-paid. Requires `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` secrets — returns 503 "Payments are not configured yet" until they are set.
  - `POST /post-verify-payment`: verifies the Razorpay HMAC-SHA256 signature (`order_id|payment_id`) against the pending purchase row for that user+post, then marks it `paid`. Access is permanent after that.
- Frontend routes under `/<username>`: `post/:postId` (media viewer), `post/:postId/edit`, `post/:postId/report`.
- Media viewer: full-screen black overlay; back arrow, owner avatar+username, 3-dot menu (owner: Edit/Delete with confirm dialog; others: Report), like heart + count, caption, Free/₹price chip. Images: swipe arrows, x/y counter, dots. Videos: tap to play/pause, seek bar, current/total duration. Locked paid posts show the unlock screen; "Unlock for ₹X" opens Razorpay Checkout and re-fetches access only after server-side verification.
- Edit post page: media preview, caption (200 max + counter), Free/Paid dropdown, INR amount (min ₹10) — saves via `/post-update` with the same public id.
- Report post page: reason dropdown (8 fixed reasons), additional details textarea (750 max + counter), submit -> success state. Owners are redirected away.
- Dashboard grid: whole card navigates to the viewer (paid card "Unlock" button too); grid videos are muted previews with a center play icon; the gap between the grid/video tab separator and the posts was removed.
- End-to-end tested via API (owner access, non-owner paid lock, simulated purchase unlock, like toggle, edit validation + same-id save, cross-user delete rejection, report row contents, storage cleanup on delete) and in the browser (viewer, carousel, like, menu, delete dialog, edit save/validation, owner report redirect). Test users/posts/reports/purchases cleaned up.

## Messaging (inbox + chat)

- Migration `008`: `conversations` (ordered user pair unique, `created_by`, `status pending/accepted` for the request flow, per-user `cleared_a/cleared_b` for delete-for-me), `messages` (body <=2000, `media_path/media_type`, `is_once` + `viewed_at` for view-once, `seen_at`, `deleted_for uuid[]`, `deleted_for_all`), `user_blocks`, `user_reports` (reporter + reported usernames/uuids, conversation id, reason, details <=750, timestamp). RLS enabled with no public policies — everything goes through the edge function. Private `chat-media` bucket (100MB, image/video) served via signed URLs only.
- Endpoints (cookie auth): `GET/POST /conversations` (list with peer profile, preview, unread count, request flag / find-or-create by username), `POST /conversation-accept`, `GET /user-search?q=`, `GET /messages` (also marks incoming as seen), `POST /messages` (recipient reply auto-accepts a request; blocked users can't send in either direction), `POST /chat-upload-url`, `POST /message-view-once` (recipient only, single use — marked viewed atomically before the URL is issued, second call gets 410), `POST /message-delete` (mode `me` appends to `deleted_for`; mode `both` only for own messages, wipes body + media), `POST /chat-delete` (mode `me` sets the per-user cleared timestamp; mode `both` removes media, conversation, and messages), `POST /chat-block`, `POST /chat-report`.
- Inbox (`/<username>/inbox`): search box on top, tabs All chats / Unread (n) / Requests (n). The first message from a new user lands in Requests for the recipient; accepting (or replying) moves it to All chats. Rows show avatar, name, preview, time (h:mm / Yesterday / Nd / date) and rose unread badges. Searching also finds users by username to start a new chat. Polls every 10s.
- Chat page (`/<username>/chat/<id>`): full-screen (own page, no app header/mobile navbar), back button top-left, peer avatar/name, audio + video call icons (UI placeholders for later), and a 3-dot menu with Block/Unblock user, Report user (reason + details modal), and Delete chat (for me / for both). Request banner with Accept/Delete for incoming requests. Bubbles have date separators, per-message time, and Sent/Seen status on own messages. Long-press selects messages (multi-select) for Delete for me / Delete for everyone (everyone only when all selected are yours). Composer: photo/video attach with a "View once" checkbox and upload %, 40-emoji picker, Enter to send.
- View-once media renders as a "Tap to view" pill for the recipient, opens full screen exactly once, then shows "Opened" on both sides. Normal media opens in a full-screen viewer. No download/forward affordances: context menu blocked, `controlsList="nodownload"`, no PiP, images non-draggable. (True screenshot blocking is not technically possible in a web browser.)
- Tested end-to-end via API (request -> unread -> seen -> reply auto-accept, view-once single use, delete for me vs both, block send rejection both ways, report row contents, clear-for-me hiding the chat only for that user, delete-for-both wiping storage + rows) and in the browser (inbox tabs, request accept, emoji send, chat UI). All test users/conversations cleaned up.

