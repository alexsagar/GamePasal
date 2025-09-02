# OAuth Setup Instructions

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Set authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain
6. Copy the Client ID and add it to your environment variables

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production domain
5. Copy the App ID and add it to your environment variables

## Environment Variables

Create a `.env` file in the frontend directory with:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_API_URL=http://localhost:5000
```

## Features Implemented

- ✅ Google OAuth login/signup
- ✅ Facebook OAuth login/signup
- ✅ Automatic account linking for existing users
- ✅ New user creation with social accounts
- ✅ JWT token generation and management
- ✅ Social account verification

## Usage

Users can now:
1. Click "Continue with Google" or "Continue with Facebook" on signup/login pages
2. If they have an existing account with the same email, the social account will be linked
3. If they don't have an account, a new one will be created automatically
4. They'll be logged in immediately after successful OAuth authentication

## Security Notes

- Social accounts are automatically verified upon successful OAuth
- Users created via OAuth are marked as verified
- Random passwords are generated for OAuth users
- All OAuth tokens are validated on the backend
