# Frontend Integration - Quick Start Guide

## ✅ Setup Complete

The service layer is ready! Now we need to update React components to use the new Java backend.

## 🎯 Components to Update (Priority Order)

### 1. **Header.jsx** - Logout (EASIEST - Start Here!)

**Current Code:**
```javascript
import Parse from "parse";

const handleLogout = async () => {
  try {
    await Parse.User.logOut();
  } catch (err) {
    console.log("Err while logging out", err);
  }
};
```

**New Code:**
```javascript
import authService from "../services/authService";

const handleLogout = async () => {
  try {
    authService.logout(); // No await needed - synchronous
  } catch (err) {
    console.log("Err while logging out", err);
  }
};
```

### 2. **DashboardReport.jsx** - Get Current User ID

**Current:**
```javascript
const currentUser = Parse.User.current().id;
```

**New:**
```javascript
import authService from "../../services/authService";

const userId = authService.getUserId(); // From localStorage
```

### 3. **Dashboard Card.jsx** - Get User Details

**Current:**
```javascript
const res = await Parse.Cloud.run("getUserDetails");
const currentUser = Parse.User.current();
```

**New:**
```javascript
import authService from "../../services/authService";

const user = authService.getCurrentUser();
// user.userId, user.username, user.email available
```

### 4. **DriveBody.jsx** - List Documents

**Current:**
```javascript
const query = new Parse.Query("contracts_Document");
query.equalTo("CreatedBy", Parse.User.current());
const documents = await query.find();
```

**New:**
```javascript
import documentService from "../../services/documentService";

const response = await documentService.getAll(0, 20); // page, size
const documents = response.content; // Array of documents
```

### 5. **AddUser.jsx** - Team Operations

**Current:**
```javascript
const teamRes = await Parse.Cloud.run("getteams", { active: true });
const res = await Parse.Cloud.run("getUserDetails", { email });
await Parse.Cloud.run("adduser", params);
```

**New:**
```javascript
import teamService from "../services/teamService";
import authService from "../services/authService";

const teams = await teamService.getAll(0, 100); // Get all teams
const user = authService.getCurrentUser();
await teamService.addMember(teamId, userId, role);
```

## 🧪 Testing Strategy

### Test Each Component After Migration

```bash
# 1. Start both servers
# Backend: http://localhost:8080
# Frontend: http://localhost:3000

# 2. Open browser DevTools (F12)
# 3. Go to Network tab
# 4. Test the component functionality
# 5. Verify API calls to localhost:8080 (not Parse Server)
```

### Example Test Workflow

1. **Test Logout (Header.jsx)**:
   - Login to the app
   - Click profile → Logout
   - Check Network tab: Should clear localStorage (no API call needed)
   - Verify redirect to login page

2. **Test Document List (DriveBody.jsx)**:
   - Go to Drive/Documents page
   - Check Network tab: `GET http://localhost:8080/api/v1/documents?page=0&size=20`
   - Verify documents display

3. **Test Team Operations (AddUser.jsx)**:
   - Go to Add User page
   - Check Network tab: `GET http://localhost:8080/api/v1/teams`
   - Verify teams load in dropdown

## 🔧 Common Issues & Solutions

### Issue: 401 Unauthorized
**Cause**: JWT token not in localStorage
**Solution**: Login again to get fresh JWT token

### Issue: CORS Error
**Cause**: Backend not allowing frontend origin
**Solution**: Already fixed! Backend allows localhost:3000 and localhost:5173

### Issue: Parse is not defined
**Cause**: Removed Parse import but code still uses it
**Solution**: Make sure all Parse references are replaced

### Issue: Cannot read property 'X' of undefined
**Cause**: Response structure different from Parse
**Solution**: Check API response in Network tab, adjust mapping

## 📝 Code Mapping Reference

| Parse SDK | Java Backend |
|-----------|-------------|
| `Parse.User.logOut()` | `authService.logout()` |
| `Parse.User.current()` | `authService.getCurrentUser()` |
| `Parse.User.current().id` | `authService.getUserId()` |
| `Parse.Cloud.run("functionName", params)` | Use specific service method |
| `new Parse.Query("ClassName")` | Use service method (e.g., `documentService.getAll()`) |
| `query.find()` | Service returns data directly |
| `object.get("field")` | Use dot notation: `object.field` |

## 🚀 Next Steps

1. **Update Header.jsx** (5 min) - Test logout
2. **Update DashboardReport.jsx** (5 min) - Test user ID display
3. **Update DashboardCard.jsx** (10 min) - Test user details
4. **Update DriveBody.jsx** (20 min) - Test document list
5. **Update AddUser.jsx** (30 min) - Test team operations

**Total Time**: ~1.5 hours for core functionality

## ✅ Success Criteria

- [ ] User can login with Java backend
- [ ] User can logout successfully
- [ ] Documents load from Java backend
- [ ] Teams load from Java backend
- [ ] No Parse SDK calls in Network tab
- [ ] All API calls go to `http://localhost:8080`

---

**Ready to start?** Open `Header.jsx` and make the logout change first!
