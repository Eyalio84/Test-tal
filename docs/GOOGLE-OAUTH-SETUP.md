# Google OAuth Setup — Tutorial

How to create Google OAuth 2.0 credentials for local development and production.

---

## What you need

- Google account with access to console.cloud.google.com
- Your app running at a known URL (e.g. `http://localhost:3000` for dev)

---

## Step 1 — Create or select a project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Top-left dropdown → **New Project**
3. Name: e.g. `tal-boilerplate` → **Create**
4. Make sure the new project is selected in the dropdown

---

## Step 2 — Configure OAuth Consent Screen

This is required before creating credentials. Do it once per project.

1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. User Type: **External** (works with any Google account, not just Workspace)
3. Fill in:
   - App name: `Tal Boilerplate` (or client's brand name)
   - User support email: your email
   - Developer contact email: your email
4. Click **Save and Continue**
5. **Scopes** page → skip, click **Save and Continue**
6. **Test users** page → skip for now (app is in Testing mode, only listed users can sign in)
   - Add your own email as a test user to allow your account during development
7. Click **Back to Dashboard**

Status will show **Testing** — that's correct for development.

> **For production:** You'll need to publish the app (click "Publish App"). For basic login (no sensitive scopes), Google does not require a formal review.

---

## Step 3 — Create OAuth 2.0 Credentials

1. Left sidebar → **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `localhost` (or `production` — create separate ones per environment)
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Click **Create**

A popup shows your credentials — copy them immediately.

---

## Step 4 — Add to .env.local

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_SECRET=<output of: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Step 5 — Test it

```bash
# Start dev server
ESBUILD_BINARY_PATH=/data/data/com.termux/files/usr/tmp/esbuild-native/esbuild \
  node node_modules/next/dist/bin/next dev

# Then visit:
# http://localhost:3000/api/auth/signin   → Google button
# Click → sign in → redirected to homepage
# http://localhost:3000/api/auth/session  → returns your user object
```

---

## For production (Vercel)

1. In Vercel project settings → **Environment Variables** → add all 4 vars
2. `NEXTAUTH_URL` = `https://yourdomain.com`
3. In Google Cloud Console → **Credentials** → edit the OAuth client
4. Add to **Authorized JavaScript origins**: `https://yourdomain.com`
5. Add to **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`

> Create a separate OAuth Client ID for production — keeps dev and prod isolated.

---

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | Redirect URI not in Google Console | Add exact URI to credentials |
| `access_denied` | App in Testing, your email not in test users | Add email to test users list |
| `invalid_client` | Wrong client ID or secret | Re-copy from Google Console |
| `NEXTAUTH_SECRET` missing | Env var not set | Run `openssl rand -base64 32` |

---

## Do NOT use

- **Admin Settings API** (apps-apis.google.com/a/feeds) — that's for Workspace domain management, not OAuth login
- **Service accounts** — those are for server-to-server, not user login
- **API Key** credentials — those are for public APIs, not OAuth
