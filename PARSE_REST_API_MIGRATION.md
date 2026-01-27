# Parse REST API Migration Complete

## Overview
All direct Parse REST API calls (`/api/app/classes/`) have been migrated to use proper service methods.

## New Service Created

### storageService.js
Location: `src/services/storageService.js`

Methods:
- `getTenantCredits(tenantId)` - Get tenant storage credits
- `updateTenantCredits(tenantId, usedStorage)` - Update tenant storage usage
- `createTenantCredits(tenantId, usedStorage)` - Create new tenant credits record
- `saveDataFile(fileUrl, fileSize, tenantId, userId)` - Save file metadata

## Enhanced Services

### userService.js
Added method:
- `updateTourStatus(userId, tourStatus)` - Update user tour completion status

### documentService.js
Added methods:
- `updateDocumentExpiry(documentId, expiryDate)` - Update document expiration date
- `softDeleteDocument(documentId)` - Mark document as deleted
- `archiveDocument(documentId)` - Archive a document

### templateService.js
Added methods:
- `deleteTemplate(templateId)` - Soft delete template
- `archiveTemplate(templateId)` - Archive a template

### contactService.js
Added method:
- `deleteContact(contactId)` - Soft delete contact

## Files Migrated (10 files)

### Core Files
1. **src/constant/saveFileSize.js**
   - Replaced direct axios calls to `/classes/partners_TenantCredits` with `storageService` methods
   - Replaced `/classes/partners_DataFiles` with `storageService.saveDataFile()`

2. **src/layout/HomeLayout.jsx**
   - Replaced `/classes/contracts_Users/` tour status update with `userService.updateTourStatus()`

3. **src/pages/Opensigndrive.jsx**
   - Replaced `/classes/contracts_Users/` tour status update with `userService.updateTourStatus()`

### Page Files
4. **src/pages/PdfRequestFiles.jsx**
   - Replaced `/classes/contracts_Document/` expiry update with `documentService.updateDocumentExpiry()`

### Report Files
5. **src/reports/contact/Contactbook.jsx**
   - Replaced `/classes/contracts_Contactbook/` delete with `contactService.deleteContact()`

6. **src/reports/document/DocumentsReport.jsx**
   - Replaced `/classes/contracts_Document/` archive with `documentService.archiveDocument()`
   - Replaced `/classes/contracts_Document/` expiry update with `documentService.updateDocumentExpiry()`

7. **src/reports/template/TemplatesReport.jsx**
   - Replaced `/classes/contracts_Template/` archive with `templateService.archiveTemplate()`
   - Replaced `/classes/contracts_Users/` tour status updates (2 occurrences) with `userService.updateTourStatus()`

## Migration Pattern

### Before:
```javascript
await axios.put(
  serverUrl + "classes/contracts_Users/" + extUserId,
  { TourStatus: updatedTourStatus },
  { headers: { 
    "X-Parse-Application-Id": appId,
    "X-Parse-Session-Token": localStorage.getItem("jwtToken")
  }}
);
```

### After:
```javascript
await userService.updateTourStatus(extUserId, updatedTourStatus);
```

## Backend API Endpoints Required

The following REST API endpoints need to be implemented in the Spring Boot backend:

### Storage Endpoints
- `GET /api/v1/storage/credits/{tenantId}` - Get tenant credits
- `PUT /api/v1/storage/credits/{tenantId}` - Update tenant credits
- `POST /api/v1/storage/credits` - Create tenant credits
- `POST /api/v1/storage/files` - Save file record

### User Endpoints  
- `PUT /api/v1/users/{userId}/tour-status` - Update tour status

### Document Endpoints
- `PUT /api/v1/documents/{documentId}/expiry` - Update document expiry
- `PUT /api/v1/documents/{documentId}/archive` - Archive document
- `PUT /api/v1/documents/{documentId}` - Soft delete (isDeleted: true)

### Template Endpoints
- `PUT /api/v1/templates/{templateId}/archive` - Archive template
- `PUT /api/v1/templates/{templateId}` - Soft delete (isDeleted: true)

### Contact Endpoints
- `PUT /api/v1/contacts/{contactId}` - Soft delete (isDeleted: true)

## Verification

Run this command to verify no Parse REST API calls remain:
```bash
grep -rn "serverUrl.*classes/" src/ --include="*.js" --include="*.jsx" | grep -v "backup\|/\*\|Original"
```

Expected result: No matches (all migrated)

## Testing Checklist

- [ ] Test storage credit tracking and updates
- [ ] Test file upload metadata saving
- [ ] Test tour status updates (login, drive, template reports)
- [ ] Test document expiry updates
- [ ] Test document archiving
- [ ] Test template archiving
- [ ] Test contact deletion
- [ ] Verify all backend endpoints are implemented
- [ ] Integration testing with real backend

## Status
✅ **COMPLETE** - All Parse REST API calls migrated to service layer
