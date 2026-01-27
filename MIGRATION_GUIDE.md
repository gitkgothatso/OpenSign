# Frontend Migration Guide: Parse SDK → OpenSign Server Backend

## Overview
This guide outlines the migration from Parse SDK to the new OpenSign Server backend (Spring Boot + JWT authentication).

## Key Changes

### 1. Authentication Flow
**Before (Parse SDK):**
```javascript
import Parse from "parse";

// Login
const user = await Parse.User.logIn(username, password);
const sessionToken = user.getSessionToken();

// Logout
await Parse.User.logOut();

// Get current user
const currentUser = Parse.User.current();
```

**After (OpenSign Server):**
```javascript
import { authService } from '../services';

// Login
const { jwtToken, userId, username, email } = await authService.login(username, password);
localStorage.setItem('accesstoken', jwtToken);

// Logout
await authService.logout();
localStorage.removeItem('accesstoken');

// Get current user
const user = await authService.getCurrentUser();
```

### 2. User Profile Management
**Before (Parse SDK):**
```javascript
import Parse from "parse";

// Get user profile
const user = Parse.User.current();
const name = user.get('name');
const email = user.get('email');

// Update profile
user.set('name', newName);
await user.save();
```

**After (OpenSign Server):**
```javascript
import { userProfileService } from '../services';

// Get user profile
const profile = await userProfileService.getCurrentProfile();
const { name, email } = profile;

// Update profile
await userProfileService.updateProfile({ name: newName });

// Change password
await userProfileService.changePassword(currentPassword, newPassword);
```

### 3. Token Storage
**Migration Path:**
- Old: `localStorage.getItem('accesstoken')` stored Parse session token
- New: `localStorage.getItem('accesstoken')` stores JWT token
- For backward compatibility, both use the same key name

### 4. Error Handling
**Before (Parse SDK):**
```javascript
try {
  await Parse.User.logIn(username, password);
} catch (error) {
  if (error.code === Parse.Error.INVALID_SESSION_TOKEN) {
    // Handle invalid session
  }
}
```

**After (OpenSign Server):**
```javascript
try {
  await authService.login(username, password);
} catch (error) {
  if (error.response?.status === 401) {
    // Handle authentication error
  } else if (error.response?.status === 429) {
    // Handle rate limiting
  }
}
```

## Migration Steps

### Step 1: Update Dependencies
The new services are already installed in `src/services/`:
- ✅ `api-client.ts` - HTTP client with JWT support
- ✅ `auth-service.ts` - Authentication methods
- ✅ `user-profile-service.ts` - Profile management
- ✅ `index.ts` - Service exports

### Step 2: Update Components

#### Login Component
File: `src/pages/Login.jsx` → `src/pages/LoginNew.jsx`

**Changes:**
1. Import new service:
   ```javascript
   import { authService } from '../services';
   ```

2. Replace Parse.User.logIn():
   ```javascript
   // Old
   await Parse.User.logIn(username, password);
   
   // New
   const response = await authService.login(username, password);
   localStorage.setItem('accesstoken', response.jwtToken);
   ```

3. Replace Parse.User.logOut():
   ```javascript
   // Old
   await Parse.User.logOut();
   
   // New
   await authService.logout();
   ```

#### Signup Component
File: `src/pages/Signup.jsx`

**Changes:**
1. Replace Parse.Cloud.run("signup"):
   ```javascript
   // Old
   await Parse.Cloud.run("signup", { username, email, password });
   
   // New
   const response = await authService.signup({ 
     username, 
     email, 
     password,
     name: companyName 
   });
   ```

#### Profile Component
File: `src/pages/UserProfile.jsx`

**Changes:**
1. Replace Parse.User.current():
   ```javascript
   // Old
   const user = Parse.User.current();
   const name = user.get('name');
   
   // New
   const profile = await userProfileService.getCurrentProfile();
   const { name } = profile;
   ```

2. Replace profile updates:
   ```javascript
   // Old
   user.set('name', newName);
   await user.save();
   
   // New
   await userProfileService.updateProfile({ name: newName });
   ```

#### Password Reset Component
File: `src/pages/ForgetPassword.jsx`

**Changes:**
1. Replace Parse.User.requestPasswordReset():
   ```javascript
   // Old
   await Parse.User.requestPasswordReset(email);
   
   // New
   await authService.sendPasswordReset(email);
   ```

2. Replace password confirmation:
   ```javascript
   // New
   await authService.confirmPasswordReset(email, token, newPassword);
   ```

### Step 3: Update Router
Update `src/Routes.jsx` or `src/App.jsx` to use new Login component:

```javascript
// Replace
import Login from './pages/Login';

// With
import LoginNew from './pages/LoginNew';

// Update route
<Route path="/login" element={<LoginNew />} />
```

### Step 4: Test Migration

1. **Run Backend Server:**
   ```bash
   cd ~/devops/open-sign/opensignserver
   ./mvnw spring-boot:run
   ```

2. **Run Integration Tests:**
   ```bash
   cd ~/devops/open-sign/opensign-frontend/apps/OpenSign
   node test-backend-integration.js
   ```

3. **Manual Testing:**
   - [ ] Login with valid credentials
   - [ ] Login with invalid credentials
   - [ ] Logout
   - [ ] Signup new user
   - [ ] Update profile
   - [ ] Change password
   - [ ] Password reset flow

### Step 5: Remove Parse SDK (After Full Migration)
```bash
npm uninstall parse
rm -f src/services/authService.js  # Old Parse-based service
```

## Environment Configuration
Ensure `.env` file contains:
```
REACT_APP_API_URL=http://localhost:8080
```

## Backward Compatibility

### Session Token Conversion
For users with existing Parse session tokens:
```javascript
const parseSessionToken = localStorage.getItem('accesstoken');
if (parseSessionToken && !authService.isAuthenticated()) {
  try {
    const { jwtToken, user } = await authService.convertParseSession(parseSessionToken);
    localStorage.setItem('accesstoken', jwtToken);
  } catch (error) {
    // Invalid Parse session, redirect to login
    authService.logout();
    navigate('/login');
  }
}
```

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/reset-password` - Request password reset
- `POST /api/v1/auth/reset-password/confirm` - Confirm password reset
- `POST /api/v1/auth/send-otp` - Send OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP

### User Profile
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `POST /api/v1/users/me/change-password` - Change password
- `DELETE /api/v1/users/me` - Delete account

## Troubleshooting

### Issue: CORS Errors
**Solution:** Backend CORS is configured for `http://localhost:3000`. If using different port, update backend `CorsConfiguration.java`.

### Issue: 401 Unauthorized
**Causes:**
1. JWT token expired (default: 24 hours)
2. Token not present in request
3. Invalid token

**Solution:**
```javascript
// The api-client.ts automatically handles token refresh
// If token is invalid, it will redirect to login
```

### Issue: Network Errors
**Causes:**
1. Backend server not running
2. Incorrect `REACT_APP_API_URL`

**Solution:**
```bash
# Check backend status
curl http://localhost:8080/actuator/health

# Verify .env configuration
cat .env | grep REACT_APP_API_URL
```

## Migration Status Tracker

### Completed
- ✅ Created TypeScript service layer
- ✅ Deployed integration files
- ✅ Created LoginNew component
- ✅ Created integration tests
- ✅ Environment configuration

### In Progress
- 🔄 Testing LoginNew component
- 🔄 Updating router configuration

### Pending
- ❌ Migrate Signup component
- ❌ Migrate UserProfile component
- ❌ Migrate ForgetPassword component
- ❌ Migrate ChangePassword component
- ❌ Remove Parse SDK dependency
- ❌ Update all component imports

## Next Steps

1. Test LoginNew component with backend server
2. Update router to use LoginNew
3. Migrate remaining components (Signup, Profile, etc.)
4. Run full integration test suite
5. Remove Parse SDK dependency
6. Deploy to production

## Support
For issues or questions, see:
- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Complete integration guide
- [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) - Test results and validation
- Backend API docs: http://localhost:8080/swagger-ui/index.html
