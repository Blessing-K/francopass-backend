## Phase 3 – Database Integration (MongoDB Atlas)

### Tasks Implemented

- MongoDB Atlas cluster creation
- .env and dotenv setup, ensured .env was added to .gitignore
- Database connection middleware
- Mongoose models for Users, Exams, Vocabulary, Feedback, Resources
- Full CRUD endpoints replaced with Mongoose logic
- GET routes upgraded with search, sort, pagination
- Postman tested for all modules
- Confirmed validation and error handling work as expected.

### Team Contribution

- Boluwatito Kajopelaye-Ola — solo project.

## Phase 5 – Authentication & Authorization

### Tasks Implemented

- Added JWT-based authentication with email-based OTP (MFA).
- Implemented `/api/auth/login` to validate credentials and send OTP to user email.
- Implemented `/api/auth/verify-otp` to validate OTP and return final JWT token.
- Added `role` field to `User` model (roles: `admin`, `teacher`, `student`).
- Stored temporary `otp` and `otpExpires` fields on the `User` model.
- Passwords are hashed with `bcrypt` on user creation and update.
- Added `authenticate` middleware to validate JWT tokens.
- Added `authorize(...roles)` middleware generator for role-based access control (RBAC).
- Protected create/update routes to require authentication and delete routes to require `admin` role across modules.
- Frontend: added `Login` and `OTP` UI, auth helpers in `src/api.js`, token storage in `localStorage`, and token attachment to API requests.

### How to configure

- Set environment variables in `.env`.
  - For **Gmail API** (recommended - works on Render free tier and platforms that block SMTP ports):
    - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `SMTP_USER` (the Gmail address used to send).
    - Gmail API must be enabled in Google Cloud Console.
    - OAuth2 consent screen must include your email as a test user.
    - Refresh token must be generated with `https://mail.google.com/` scope.
  - Alternatively (legacy SMTP fallback): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`.
- Install dependencies: run `npm install` in `francopass-backend`.

### Notes

- OTPs expire after 5 minutes.
- Email sending priority: Gmail API (HTTP, no SMTP ports) → SMTP fallback → Ethereal test account.
- Gmail API bypasses SMTP port restrictions on free hosting platforms like Render.
- The frontend stores the JWT in `localStorage` and attaches it as a `Bearer` token to API requests.
