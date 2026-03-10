# OAuth Setup

This document explains the social login configuration used by GamePasal.

## Current Implementation

The backend exposes token-based social login endpoints:

- `POST /api/auth/google`
- `POST /api/auth/facebook`

The frontend provides the Google OAuth client through `GoogleOAuthProvider` and sends social login data to the backend API.

## Frontend Configuration

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Backend Configuration

Create or update `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

CLIENT_URL=http://localhost:5173
```

## Google Setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create OAuth credentials.
5. Add the appropriate JavaScript origins for your frontend.
6. Add the client ID to both frontend and backend environment variables as required by your implementation.

For local development, the frontend origin is typically:

```text
http://localhost:5173
```

## Facebook Setup

1. Open Facebook for Developers.
2. Create an application.
3. Enable Facebook Login.
4. Configure the allowed frontend origin and any backend callback requirements used by your environment.
5. Add the application credentials to `backend/.env`.

## Expected Behavior

- Existing users can sign in with a supported social provider.
- If the backend logic permits it, accounts can be linked by email.
- Social-authenticated users receive the same application token flow used by the rest of the system.

## Operational Notes

- Keep client IDs and secrets out of version control.
- Use separate credentials for development and production.
- Recheck allowed origins when deploying to a new domain.
- If social login fails, verify frontend origin, backend environment variables, and provider-side application status first.

