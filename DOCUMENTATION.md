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

