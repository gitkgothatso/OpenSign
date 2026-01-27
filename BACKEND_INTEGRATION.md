# OpenSign Server - Frontend Integration Guide

Complete guide for integrating the OpenSign Server backend with your React frontend application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Authentication Flow](#authentication-flow)
5. [API Client Usage](#api-client-usage)
6. [React Integration](#react-integration)
7. [CORS Configuration](#cors-configuration)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Migration from Parse](#migration-from-parse)

---

## Quick Start

### 1. Copy Integration Files

Copy these files to your React project:

```bash
# From opensignserver/frontend-integration/ to your frontend project
cp api-client.ts ../opensign-frontend/apps/OpenSign/src/services/
cp auth-service.ts ../opensign-frontend/apps/OpenSign/src/services/
cp user-profile-service.ts ../opensign-frontend/apps/OpenSign/src/services/
cp react-examples.tsx ../opensign-frontend/apps/OpenSign/src/components/auth/
```

### 2. Install Dependencies

```bash
cd ../opensign-frontend/apps/OpenSign
# No additional dependencies needed - uses native fetch API
```

### 3. Initialize Services

```typescript
// src/services/index.ts
import OpenSignApiClient from './api-client';
import AuthService from './auth-service';
import UserProfileService from './user-profile-service';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create API client
export const apiClient = new OpenSignApiClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
  onError: (error) => {
    console.error('API Error:', error);
    // Handle global errors (e.g., show toast notification)
  },
});

// Create auth service
export const authService = new AuthService({
  apiClient,
  onAuthStateChange: (state) => {
    console.log('Auth state changed:', state);
  },
  onTokenExpired: () => {
    alert('Your session has expired. Please log in again.');
    window.location.href = '/login';
  },
});

// Create user profile service
export const userProfileService = new UserProfileService({
  apiClient,
  onProfileUpdate: (profile) => {
    console.log('Profile updated:', profile);
  },
});
```

### 4. Wrap App with AuthProvider

```typescript
// src/App.tsx
import { AuthProvider } from './components/auth/react-examples';

function App() {
  return (
    <AuthProvider apiBaseURL={process.env.REACT_APP_API_URL}>
      <YourAppRoutes />
    </AuthProvider>
  );
}
```

---

## Installation

### Backend Server

Ensure the OpenSign Server is running:

```bash
cd opensignserver
./mvnw spring-boot:run
```

Server will be available at `http://localhost:8080`

**Key Endpoints:**
- API Base: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI Spec: `http://localhost:8080/v3/api-docs`
- Actuator Health: `http://localhost:8080/actuator/health`

### Environment Variables

Create `.env` file in your React project:

```bash
# Backend API URL
REACT_APP_API_URL=http://localhost:8080

# Optional: Enable debug logging
REACT_APP_DEBUG=true
```

---

## Configuration

### API Client Configuration

```typescript
import OpenSignApiClient from './services/api-client';

const apiClient = new OpenSignApiClient({
  baseURL: 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'X-Client-Version': '1.0.0',
  },
  onRequest: async (config) => {
    // Add custom headers before each request
    console.log('Request:', config.method, config.url);
    return config;
  },
  onResponse: async (response) => {
    // Process response data
    console.log('Response:', response.status);
    return response;
  },
  onError: (error) => {
    // Global error handling
    if (error.code === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }
  },
});
```

### CORS Configuration

The backend is already configured to allow CORS from your frontend.

**Backend CORS Settings** (already configured):
```yaml
# application.yml
spring:
  web:
    cors:
      allowed-origins: "http://localhost:3000,http://localhost:3001"
      allowed-methods: "GET,POST,PUT,DELETE,OPTIONS"
      allowed-headers: "*"
      allow-credentials: true
```

**If you need to add more origins**, edit `application.yml` or `application-local.yml` in the backend.

---

## Authentication Flow

### 1. User Registration (Signup)

```typescript
import { useAuth } from './components/auth/react-examples';

function SignupPage() {
  const { signup, isLoading, error } = useAuth();

  const handleSignup = async () => {
    try {
      await signup({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        phone: '+27123456789',
        company: 'Acme Corp',
        timezone: 'Africa/Johannesburg',
      });
      
      // Redirect to email verification page
      window.location.href = '/verify-email';
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  return (
    <button onClick={handleSignup} disabled={isLoading}>
      {isLoading ? 'Creating account...' : 'Sign Up'}
    </button>
  );
}
```

### 2. Email Verification

```typescript
import { authService } from './services';

async function verifyEmail(email: string, token: string) {
  try {
    const result = await authService.verifyEmail(email, token);
    console.log(result.message); // "Email verified successfully"
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

// Call when user clicks verification link
// URL format: /verify-email?email=user@example.com&token=abc123
const params = new URLSearchParams(window.location.search);
const email = params.get('email');
const token = params.get('token');

if (email && token) {
  verifyEmail(email, token);
}
```

### 3. User Login

```typescript
import { useAuth } from './components/auth/react-examples';

function LoginPage() {
  const { login, isLoading, error, authState } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await login({
        username: 'john_doe',
        password: 'SecurePass123!',
      });
      
      console.log('Logged in:', response.userId);
      console.log('JWT Token:', response.jwtToken);
      
      // Check if authenticated
      if (authState.isAuthenticated) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <>
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </>
  );
}
```

### 4. Session Persistence

The `AuthService` automatically:
- ✅ Stores JWT token in `localStorage`
- ✅ Restores session on page reload
- ✅ Checks token expiration every minute
- ✅ Automatically logs out when token expires
- ✅ Adds `Authorization: Bearer <token>` to all API requests

### 5. Password Reset Flow

```typescript
import { authService } from './services';

// Step 1: Request password reset
async function requestReset(email: string) {
  try {
    const result = await authService.requestPasswordReset(email);
    console.log(result.message); // "Password reset email sent successfully"
  } catch (error) {
    console.error('Reset request failed:', error);
  }
}

// Step 2: User clicks link in email and lands on reset page
// URL format: /reset-password?email=user@example.com&token=xyz789

// Step 3: Confirm new password
async function confirmReset(email: string, token: string, newPassword: string) {
  try {
    const result = await authService.confirmPasswordReset(email, token, newPassword);
    console.log(result.message); // "Password reset successful"
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Password reset failed:', error);
  }
}
```

### 6. Two-Factor Authentication (OTP)

```typescript
import { authService } from './services';

// Step 1: Send OTP to user's email
async function sendOtp(email: string) {
  try {
    const result = await authService.sendOtp(email);
    console.log(result.message); // "OTP sent successfully to user@example.com"
  } catch (error) {
    console.error('OTP send failed:', error);
  }
}

// Step 2: Verify OTP (6-digit code)
async function verifyOtp(email: string, otp: string) {
  try {
    const result = await authService.verifyOtp(email, otp);
    console.log(result.message); // "OTP verified successfully"
    return true;
  } catch (error) {
    console.error('OTP verification failed:', error);
    return false;
  }
}
```

---

## API Client Usage

### Direct API Calls

```typescript
import { apiClient } from './services';

// Get current user profile
const profile = await apiClient.getCurrentUserProfile();
console.log(profile.username, profile.email);

// Update profile
const updated = await apiClient.updateCurrentUserProfile({
  name: 'Jane Doe',
  phone: '+27987654321',
  company: 'New Company',
});

// Change password
await apiClient.changePassword({
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass456!',
});

// Delete account
await apiClient.deleteAccount();
```

### Using User Profile Service

```typescript
import { userProfileService } from './services';

// Get profile (with caching)
const profile = await userProfileService.getProfile();

// Update name
await userProfileService.updateName('Jane Doe');

// Update phone
await userProfileService.updatePhone('+27987654321');

// Update company info
await userProfileService.updateCompanyInfo('New Company', 'Senior Developer');

// Update timezone
await userProfileService.updateTimezone('Europe/London');

// Validate phone before updating
if (UserProfileService.validatePhone('+27123456789')) {
  await userProfileService.updatePhone('+27123456789');
}

// Validate password strength
const validation = UserProfileService.validatePassword('weak');
if (!validation.valid) {
  console.log(validation.message);
}

// Get common timezones
const timezones = UserProfileService.getCommonTimezones();
```

---

## React Integration

### Using the useAuth Hook

```typescript
import { useAuth, ProtectedRoute } from './components/auth/react-examples';

function Dashboard() {
  const { authState, logout, refreshProfile } = useAuth();
  const { user } = authState;

  return (
    <div>
      <h1>Welcome, {user?.name || user?.username}!</h1>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshProfile}>Refresh Profile</button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider apiBaseURL="http://localhost:8080">
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}
```

### Example: Profile Edit Form

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from './components/auth/react-examples';
import { userProfileService } from './services';

function ProfileEditForm() {
  const { authState, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    jobTitle: '',
    timezone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authState.user) {
      setFormData({
        name: authState.user.name || '',
        phone: authState.user.phone || '',
        company: authState.user.company || '',
        jobTitle: authState.user.jobTitle || '',
        timezone: authState.user.timezone || 'America/New_York',
      });
    }
  }, [authState.user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await userProfileService.updateProfile(formData);
      await refreshProfile(); // Update context with new data
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(`Update failed: ${error.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="tel"
        placeholder="Phone (+27123456789)"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        pattern="^\+\d{10,15}$"
      />
      <input
        type="text"
        placeholder="Company"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

---

## Error Handling

### API Error Structure

```typescript
interface ApiError {
  code?: number;      // HTTP status code or custom error code
  error: string;      // Error message
  message?: string;   // Additional details
  errors?: Record<string, string>; // Validation errors (field-level)
}
```

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 101 | User not found | Check username/email |
| 141 | Username already exists | Choose different username |
| 203 | Email already exists | Use different email or login |
| 209 | Invalid session token | Re-authenticate |
| 210 | Invalid/expired token | Request new token |
| 400 | Validation error | Check `errors` object for field-specific messages |
| 401 | Unauthorized | Login required |
| 403 | Forbidden | Wrong password or insufficient permissions |
| 404 | Not found | Resource doesn't exist |
| 429 | Too many requests | Rate limit exceeded, retry later |

### Error Handling Example

```typescript
import { apiClient } from './services';

async function updateProfile(data: UpdateProfileRequest) {
  try {
    const result = await apiClient.updateCurrentUserProfile(data);
    return result;
  } catch (error: any) {
    // Handle validation errors
    if (error.status === 400 && error.errors) {
      // Field-level errors
      Object.entries(error.errors).forEach(([field, message]) => {
        console.error(`${field}: ${message}`);
        // Display next to form field
      });
      return;
    }

    // Handle authentication errors
    if (error.code === 401 || error.code === 209) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
      return;
    }

    // Handle rate limiting
    if (error.code === 429) {
      alert('Too many requests. Please try again later.');
      return;
    }

    // Generic error
    alert(`Error: ${error.error || error.message || 'Unknown error'}`);
  }
}
```

---

## Best Practices

### 1. Token Management

✅ **DO:**
- Let `AuthService` handle token storage automatically
- Check `authService.isAuthenticated()` before protected operations
- Use `ProtectedRoute` component for authenticated pages

❌ **DON'T:**
- Manually manage tokens in components
- Store tokens in state (use AuthService)
- Ignore token expiration

### 2. API Calls

✅ **DO:**
- Use TypeScript types from `api-client.ts`
- Handle errors with try/catch
- Show loading states during API calls
- Use the provided services instead of raw fetch

❌ **DON'T:**
- Make direct fetch calls to the API
- Ignore error responses
- Block UI without loading indicators

### 3. Security

✅ **DO:**
- Validate user input before sending to API
- Use HTTPS in production
- Store sensitive data server-side only
- Implement logout on token expiration

❌ **DON'T:**
- Log sensitive data (passwords, tokens)
- Store passwords in state
- Trust client-side validation alone

### 4. Performance

✅ **DO:**
- Use `userProfileService.getProfile()` for cached data
- Implement debouncing for search/filter inputs
- Show optimistic UI updates when possible

❌ **DON'T:**
- Fetch profile on every render
- Make redundant API calls
- Block UI for non-critical operations

---

## Migration from Parse

### Converting Parse Session to JWT

If you have existing Parse users, convert their session tokens:

```typescript
import { authService } from './services';

async function migrateParseUser(parseSessionToken: string) {
  try {
    const response = await authService.convertSession(parseSessionToken);
    console.log('Migrated to JWT:', response.jwtToken);
    
    // User is now authenticated with JWT
    // Parse session token is also returned if needed
    console.log('Parse token:', response.parseSessionToken);
    
    return response;
  } catch (error) {
    console.error('Migration failed:', error);
    // Fallback: prompt user to log in
  }
}
```

### Parse to OpenSign Server Mapping

| Parse | OpenSign Server | Notes |
|-------|-----------------|-------|
| `Parse.User.current()` | `authService.getCurrentUser()` | Returns user from state |
| `Parse.User.logIn()` | `authService.login()` | Returns JWT instead of session |
| `Parse.User.signUp()` | `authService.signup()` | Sends verification email |
| `Parse.User.logOut()` | `authService.logout()` | Clears local storage |
| Session token | JWT token | Use `Authorization: Bearer <jwt>` |

---

## API Reference

### Quick Links

- **Swagger UI**: http://localhost:8080/swagger-ui/index.html  
  Interactive API documentation with "Try it out" feature

- **OpenAPI Spec**: http://localhost:8080/v3/api-docs  
  Full specification in JSON format

- **Health Check**: http://localhost:8080/actuator/health  
  Server health status

### Available Endpoints

**Authentication:**
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/convert-session` - Convert Parse session
- `POST /api/v1/auth/reset-password` - Request password reset
- `POST /api/v1/auth/reset-password/confirm` - Confirm password reset
- `POST /api/v1/auth/send-otp` - Send OTP for 2FA
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/verify-email` - Verify email address

**User Profile:**
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update profile
- `POST /api/v1/users/change-password` - Change password
- `DELETE /api/v1/users/me` - Delete account

**Health & Monitoring:**
- `GET /actuator/health` - Health status
- `GET /actuator/info` - Application info
- `GET /actuator/metrics` - Metrics data
- `GET /actuator/prometheus` - Prometheus metrics

---

## Troubleshooting

### CORS Errors

**Problem:** `Access-Control-Allow-Origin` error

**Solution:**
1. Check backend is running: `curl http://localhost:8080/actuator/health`
2. Verify CORS configuration in `application.yml`
3. Ensure frontend URL matches allowed origins

### 401 Unauthorized

**Problem:** API returns 401 even after login

**Solution:**
1. Check token is stored: `localStorage.getItem('opensign_auth_state')`
2. Verify token in requests: Check browser DevTools Network tab
3. Token may be expired - try logging in again

### Network Errors

**Problem:** `Failed to fetch` or connection refused

**Solution:**
1. Verify backend is running on port 8080
2. Check API base URL matches in `.env`
3. Disable VPN/firewall temporarily to test

---

## Support

- **Issues**: https://github.com/gitkgothatso/opensignserver/issues
- **Documentation**: See `README.md` in backend repository
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html

---

## License

This integration code is provided under the same license as the OpenSign Server project (AGPL-3.0).
