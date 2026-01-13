# Remember Me Implementation

## Overview
This application implements a secure "Remember Me" feature that persists user sessions across browser restarts while adhering to modern security best practices.

## Security Features

### ✅ What We Do (Secure)
- **No Credential Storage**: Passwords are NEVER stored on the client side
- **Token-Based Authentication**: Uses secure JWT tokens managed by Supabase
- **HttpOnly Cookies**: Authentication tokens stored in HttpOnly cookies (JavaScript cannot access them)
- **Secure Flag**: Cookies only transmitted over HTTPS in production
- **SameSite Protection**: CSRF protection via SameSite cookie attribute
- **Automatic Token Rotation**: Supabase automatically rotates refresh tokens
- **30-Day Expiration**: Persistent sessions expire after 30 days of inactivity
- **Instant Invalidation**: Logout immediately clears all tokens

### ❌ What We Don't Do (Security Risks)
- Store passwords in localStorage, sessionStorage, or cookies
- Use persistent sessions without expiration
- Keep tokens after explicit logout
- Allow access without periodic re-authentication

## How It Works

### 1. Login Flow
```typescript
// User checks "Remember Me" checkbox
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    persistSession: rememberMe, // Controls session persistence
  },
});
```

**When rememberMe = true:**
- Supabase stores refresh token in localStorage
- Refresh token valid for 30 days
- Access token auto-refreshes (expires after 1 hour)
- Session persists across browser restarts

**When rememberMe = false:**
- Session stored in memory only
- Cleared when browser closes
- User must log in again on next visit

### 2. Token Management

#### Access Tokens (Short-lived)
- Expire after 1 hour
- Used for API requests
- Automatically refreshed using refresh token
- Stored in localStorage with encryption

#### Refresh Tokens (Long-lived)
- Valid for 30 days
- Used only to obtain new access tokens
- Automatically rotated by Supabase after each use
- HttpOnly cookie storage (when using server-side)

### 3. Logout Flow
```typescript
// Clears ALL tokens and sessions
await supabase.auth.signOut();
```

**What happens on logout:**
1. Access token invalidated
2. Refresh token revoked on server
3. All cookies cleared
4. localStorage auth data removed
5. User redirected to home page

### 4. Automatic Session Refresh
```typescript
// Configured in lib/supabase/client.ts
{
  auth: {
    autoRefreshToken: true,  // Auto-refresh before expiry
    persistSession: true,    // Allow persistence if enabled at login
    detectSessionInUrl: true // Handle OAuth callbacks
  }
}
```

## User Experience

### With "Remember Me" Checked
1. User logs in with checkbox enabled
2. Closes browser completely
3. Reopens browser and visits app
4. **Automatically logged in** (if within 30 days)
5. No password required

### Without "Remember Me"
1. User logs in without checkbox
2. Closes browser
3. Reopens browser and visits app
4. **Must log in again**
5. Session not persisted

### After Logout
- All sessions cleared immediately
- Must log in again regardless of "Remember Me" setting
- Tokens revoked on server side

## Security Considerations

### Token Storage
- **Client-side**: localStorage (encrypted by Supabase SDK)
- **Server-side**: HttpOnly cookies (JavaScript cannot access)
- **Never stored**: Plain text passwords

### Session Duration
- **Access Token**: 1 hour (short-lived, frequently refreshed)
- **Refresh Token**: 30 days (long-lived, automatically rotated)
- **Inactivity**: Session expires if no activity for 30 days

### Token Rotation
Supabase implements automatic refresh token rotation:
1. Client uses refresh token to get new access token
2. Server issues new access token
3. Server also issues new refresh token
4. Old refresh token becomes invalid
5. Process repeats on next refresh

This prevents stolen refresh tokens from being reused indefinitely.

### CSRF Protection
- SameSite cookie attribute prevents cross-site request forgery
- Tokens cannot be sent in cross-origin requests
- Additional CSRF tokens not needed with HttpOnly + SameSite

## Implementation Files

### Frontend
- **`app/login/page.tsx`**: Login form with "Remember Me" checkbox
- **`lib/supabase/client.ts`**: Browser client configuration with session persistence

### Backend
- **`lib/supabase/server.ts`**: Server client with secure cookie handling
- **`app/dashboard/actions.ts`**: Logout action that clears all tokens

### Components
- **`components/LogoutButton.tsx`**: Logout button component

## Testing the Feature

### Test 1: Persistent Session
1. Log in with "Remember Me" checked
2. Close browser completely (all windows)
3. Reopen browser and navigate to app
4. ✅ Should be automatically logged in

### Test 2: Non-Persistent Session
1. Log in WITHOUT "Remember Me" checked
2. Close browser completely
3. Reopen browser and navigate to app
4. ✅ Should require login again

### Test 3: Logout Clears Session
1. Log in with "Remember Me" checked
2. Click logout
3. Close and reopen browser
4. ✅ Should require login again (session cleared)

### Test 4: Token Expiration
1. Log in with "Remember Me" checked
2. Wait 31+ days without using app
3. Open app
4. ✅ Should require login again (refresh token expired)

## Best Practices Implemented

✅ **No Credential Storage**: Passwords never stored client-side  
✅ **Token-Based Auth**: JWT tokens with automatic refresh  
✅ **Secure Cookies**: HttpOnly, Secure, SameSite flags  
✅ **Token Rotation**: Automatic rotation prevents replay attacks  
✅ **Session Expiration**: 30-day maximum for convenience vs security  
✅ **Explicit Logout**: Immediately invalidates all tokens  
✅ **Auto-Refresh**: Seamless user experience with 1-hour token refresh  
✅ **Server-Side Validation**: All auth checks happen server-side  

## Future Enhancements

### Potential Improvements
- [ ] Add "Trust this device" option for 90-day sessions
- [ ] Implement device management (view/revoke active sessions)
- [ ] Add email notification for new login from unrecognized device
- [ ] Implement MFA (Multi-Factor Authentication) option
- [ ] Add session activity log for security-conscious users
- [ ] Configurable session duration per user role

## Technical References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [HttpOnly Cookie Security](https://owasp.org/www-community/HttpOnly)
