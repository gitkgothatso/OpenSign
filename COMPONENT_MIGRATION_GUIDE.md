# Component Migration Guide - Parse SDK to REST API

## Quick Reference

### Common Parse Patterns → Service Layer Replacements

#### 1. Get Current User

**Before:**
```javascript
import Parse from 'parse';
const currentUser = Parse.User.current();
const userId = currentUser.id;
```

**After:**
```javascript
import { authService } from '../services/authService';
import { userService } from '../services/userService';

// Option 1: Get basic user info from localStorage
const currentUser = authService.getCurrentUser(); // {id, username, email}

// Option 2: Get full user details from API
const userDetails = await userService.getCurrentUser();
```

---

#### 2. Get User Details (Cloud Function)

**Before:**
```javascript
const userDetails = await Parse.Cloud.run("getUserDetails");
```

**After:**
```javascript
import { userService } from '../services/userService';
const userDetails = await userService.getCurrentUser();
```

---

#### 3. Query Documents

**Before:**
```javascript
const query = new Parse.Query("contracts_Document");
query.equalTo("CreatedBy", Parse.User.current());
const documents = await query.find();
```

**After:**
```javascript
import { documentService } from '../services/documentService';
const response = await documentService.getUserDocuments();
const documents = response.content || response; // Handle paginated response
```

---

#### 4. Get Single Document

**Before:**
```javascript
const query = new Parse.Query("contracts_Document");
const document = await query.get(docId);
```

**After:**
```javascript
import { documentService } from '../services/documentService';
const document = await documentService.getDocument(docId);
```

---

#### 5. Search Documents

**Before:**
```javascript
const query = new Parse.Query("contracts_Document");
query.contains("Name", searchTerm);
const results = await query.find();
```

**After:**
```javascript
import { documentService } from '../services/documentService';
const results = await documentService.searchDocuments(searchTerm);
```

---

#### 6. Create Document

**Before:**
```javascript
const Document = new Parse.Object("contracts_Document");
Document.set("Name", name);
Document.set("Description", description);
Document.set("CreatedBy", Parse.User.createWithoutData(userId));
await Document.save();
```

**After:**
```javascript
import { documentService } from '../services/documentService';
const newDoc = await documentService.saveDocument({
  name,
  description
  // createdBy is set automatically by backend based on JWT token
});
```

---

#### 7. Update Document

**Before:**
```javascript
const query = new Parse.Query("contracts_Document");
const document = await query.get(docId);
document.set("Name", newName);
await document.save();
```

**After:**
```javascript
import { documentService } from '../services/documentService';
await documentService.updateDocument(docId, { name: newName });
```

---

#### 8. Delete Document

**Before:**
```javascript
const query = new Parse.Query("contracts_Document");
const document = await query.get(docId);
await document.destroy();
```

**After:**
```javascript
import { documentService } from '../services/documentService';
await documentService.deleteDocument(docId);
```

---

#### 9. Forward Document Email

**Before:**
```javascript
const params = { docId, recipients, message };
await Parse.Cloud.run("forwarddoc", params);
```

**After:**
```javascript
import { documentService } from '../services/documentService';
await documentService.forwardDocument(docId, { recipients, message });
```

---

#### 10. Folder Operations

**Before:**
```javascript
const FolderQuery = new Parse.Query(folderCls);
FolderQuery.equalTo("CreatedBy", Parse.User.current());
const folders = await FolderQuery.find();
```

**After:**
```javascript
import { folderService } from '../services/folderService';
const folders = await folderService.getUserFolders();
```

---

#### 11. Create Folder

**Before:**
```javascript
const Folder = new Parse.Object(folderCls);
Folder.set("Name", folderName);
Folder.set("CreatedBy", Parse.User.createWithoutData(currentUser.id));
await Folder.save();
```

**After:**
```javascript
import { folderService } from '../services/folderService';
await folderService.createFolder({ name: folderName });
```

---

#### 12. File Upload

**Before:**
```javascript
const parseFile = new Parse.File(fileName, file);
await parseFile.save();
const fileUrl = parseFile.url();
```

**After:**
```javascript
import { documentService } from '../services/documentService';
const result = await documentService.uploadFile(docId, file);
const fileUrl = result.fileUrl;
```

---

#### 13. Count Documents

**Before:**
```javascript
const query = new Parse.Query("contracts_Document");
const count = await query.count();
```

**After:**
```javascript
import { documentService } from '../services/documentService';
const count = await documentService.getDocumentCount();
```

---

## Response Format Differences

### Parse Response (Array)
```javascript
const results = await query.find();
// results is an array: [{...}, {...}]
```

### Spring Boot Response (Paginated)
```javascript
const response = await documentService.getUserDocuments();
// response is: {content: [{...}, {...}], totalElements: 10, totalPages: 1, ...}

// Extract content:
const results = response.content || response; // Backward compatible
```

---

## Migration Checklist for Each Component

1. **Add Imports**
   ```javascript
   import { authService } from '../services/authService';
   import { userService } from '../services/userService';
   import { documentService } from '../services/documentService';
   import { folderService } from '../services/folderService';
   ```

2. **Remove Parse Import**
   ```javascript
   // DELETE THIS:
   import Parse from 'parse';
   ```

3. **Replace Parse.User.current()**
   - For basic info: `authService.getCurrentUser()`
   - For full details: `await userService.getCurrentUser()`

4. **Replace Parse.Query operations**
   - Document queries → `documentService.*`
   - Folder queries → `folderService.*`

5. **Replace Parse.Cloud.run()**
   - "getUserDetails" → `userService.getCurrentUser()`
   - "forwarddoc" → `documentService.forwardDocument()`
   - Check PARSE_MIGRATION.md for other mappings

6. **Handle Paginated Responses**
   ```javascript
   const response = await documentService.getUserDocuments();
   const documents = response.content || response;
   ```

7. **Remove Parse-specific localStorage keys**
   ```javascript
   // OLD (DELETE):
   localStorage.getItem('Parse/' + appId + '/currentUser');
   
   // NEW:
   localStorage.getItem('jwtToken');
   ```

8. **Test the component**
   - Verify all functionality works
   - Check browser console for errors
   - Test CRUD operations

---

## Common Issues and Solutions

### Issue: "Parse is not defined"
**Solution:** You successfully removed Parse! Now replace the Parse operations with service calls.

### Issue: "documents.map is not a function"
**Solution:** Extract `content` from paginated response:
```javascript
const documents = response.content || response;
```

### Issue: "CreatedBy reference not working"
**Solution:** Backend automatically sets createdBy based on JWT token. Remove manual CreatedBy setting:
```javascript
// DELETE THIS:
Document.set("CreatedBy", Parse.User.createWithoutData(userId));

// Backend handles it automatically based on JWT
```

### Issue: "sessionToken is invalid"
**Solution:** The backend uses JWT, not Parse sessions. Update authentication flow:
```javascript
// Remove:
sessionToken: localStorage.getItem("accesstoken")

// JWT is automatically added by apiClient interceptor
```

### Issue: "Cannot read property 'objectId' of null"
**Solution:** Parse.User.current() returns null if not logged in. Use authService:
```javascript
// Before:
const currentUser = Parse.User.current();
if (currentUser) {
  const userId = currentUser.id;
}

// After:
const currentUser = authService.getCurrentUser();
if (currentUser) {
  const userId = currentUser.id;
}
```

---

## Testing Checklist

After migrating a component:

- [ ] No "Parse is not defined" errors
- [ ] No Parse import statements remain
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Pagination works correctly
- [ ] Error handling works
- [ ] No console errors
- [ ] Component renders without issues
- [ ] All user interactions work as expected

---

## Service Files Available

- `authService.js` - Login, logout, signup, getCurrentUser
- `userService.js` - User profile operations
- `documentService.js` - Document CRUD and operations
- `folderService.js` - Folder CRUD operations
- `emailService.js` - Email operations
- `reportService.js` - Reporting operations
- `fileService.js` - File operations
- `permissionService.js` - Permission management

See individual service files for complete API documentation.
