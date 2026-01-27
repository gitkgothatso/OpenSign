# Parse Server to REST API Migration Guide

## Overview
This document maps all Parse Server operations in the OpenSign frontend to their corresponding Spring Boot REST API endpoints.

## Authentication

### Parse Operations → REST API

| Parse Operation | REST API Endpoint | Method | Notes |
|----------------|-------------------|--------|-------|
| `Parse.User.logIn(username, password)` | `/api/v1/auth/login` | POST | Returns `{jwtToken, userId, username, email}` |
| `Parse.User.signUp(data)` | `/api/v1/auth/signup` | POST | Creates new user |
| `Parse.User.logOut()` | Local only | - | Clear `accesstoken` from localStorage |
| `Parse.User.current()` | `/api/v1/users/me` | GET | Get current authenticated user |
| `Parse.User.become(sessionToken)` | Use JWT token | - | Store JWT in `accesstoken` |
| `Parse.User.requestPasswordReset(email)` | `/api/v1/auth/reset-password` | POST | Send reset email |

## Document Operations

### Parse Query → REST API

| Parse Query | REST API Endpoint | Method | Response Type |
|-------------|-------------------|--------|---------------|
| `new Parse.Query('contracts_Document').find()` | `/api/v1/documents` | GET | `Page<DocumentResponse>` |
| `new Parse.Query('contracts_Document').get(id)` | `/api/v1/documents/{id}` | GET | `DocumentResponse` |
| `new Parse.Object('contracts_Document').save()` | `/api/v1/documents` | POST | `DocumentResponse` |
| `document.save()` (update) | `/api/v1/documents/{id}` | PUT | `DocumentResponse` |
| `document.destroy()` | `/api/v1/documents/{id}` | DELETE | 204 No Content |
| `query.contains('Name', term)` | `/api/v1/documents/search?name={term}` | GET | `List<DocumentResponse>` |
| `query.equalTo('Folder', folderId)` | `/api/v1/documents/folder/{folderId}` | GET | `List<DocumentResponse>` |
| `query.count()` | `/api/v1/documents/count` | GET | `{count: number}` |

## Cloud Functions

### Parse.Cloud.run → REST API

| Cloud Function | REST API Endpoint | Method | Purpose |
|----------------|-------------------|--------|---------|
| `Parse.Cloud.run('getUserDetails')` | `/api/v1/users/me` | GET | Get current user details |
| `Parse.Cloud.run('getDocument', {docId})` | `/api/v1/documents/{docId}` | GET | Get document by ID |
| `Parse.Cloud.run('forwarddoc', params)` | `/api/v1/documents/{id}/forward` | POST | Forward document via email |
| `Parse.Cloud.run('getlogobydomain', {domain})` | `/api/v1/tenants/logo?domain={domain}` | GET | Get tenant logo |

## Folder Operations

| Parse Operation | REST API Endpoint | Method |
|----------------|-------------------|--------|
| `new Parse.Query(folderCls).find()` | `/api/v1/folders` | GET |
| `new Parse.Query(folderCls).get(id)` | `/api/v1/folders/{id}` | GET |
| `folder.save()` | `/api/v1/folders` | POST |
| `folder.save()` (update) | `/api/v1/folders/{id}` | PUT |
| `folder.destroy()` | `/api/v1/folders/{id}` | DELETE |

## User Queries

| Parse Query | REST API Endpoint | Method |
|-------------|-------------------|--------|
| `new Parse.Query(Parse.User).find()` | `/api/v1/users` | GET |
| `new Parse.Query(Parse.User).get(id)` | `/api/v1/users/{id}` | GET |
| `user.save()` | `/api/v1/users/{id}` | PUT |

## File Upload

| Parse Operation | REST API Endpoint | Method |
|----------------|-------------------|--------|
| `new Parse.File(name, file).save()` | `/api/v1/documents/{id}/upload` | POST |

## Response Transformation

### Parse Response → Spring Data Page

Parse typically returns arrays directly. Spring Boot uses paginated responses:

**Parse Response:**
\`\`\`json
[{...}, {...}]
\`\`\`

**Spring Boot Response:**
\`\`\`json
{
  "content": [{...}, {...}],
  "totalElements": 100,
  "totalPages": 10,
  "number": 0,
  "size": 10
}
\`\`\`

**Migration Pattern:**
\`\`\`javascript
// Before (Parse)
const query = new Parse.Query('contracts_Document');
const results = await query.find();

// After (REST API)
const { data } = await api.get('/documents');
const results = data.content || data; // Handle both formats
\`\`\`

## Field Mapping

### Parse Fields → Java Backend Fields

| Parse Field | Java Field | Notes |
|-------------|-----------|--------|
| `objectId` | `id` or `objectId` | Both supported via @JsonProperty |
| `createdAt` | `createdAt` | Auto-managed |
| `updatedAt` | `updatedAt` | Auto-managed |
| `Name` | `name` or `title` | Check DocumentResponse DTO |
| `Description` | `description` | |
| `Folder` | `folderId` | Reference to folder ID |
| `CreatedBy` | `createdBy` | User ID reference |

## Token Storage

### Parse Session → JWT Token

**Parse (Old):**
\`\`\`javascript
localStorage.setItem('Parse/${appId}/currentUser', JSON.stringify(user));
\`\`\`

**JWT (New):**
\`\`\`javascript
localStorage.setItem('accesstoken', jwtToken);
\`\`\`

## Migration Checklist

- [ ] Replace all `Parse.User.logIn()` with `/api/v1/auth/login`
- [ ] Replace all `Parse.Query` with REST API calls
- [ ] Replace all `Parse.Cloud.run()` with direct API endpoints
- [ ] Update file uploads to use multipart/form-data
- [ ] Replace Parse session tokens with JWT tokens
- [ ] Update localStorage keys (remove Parse-specific ones)
- [ ] Handle paginated responses (extract `.content`)
- [ ] Update error handling (Parse errors → HTTP status codes)
- [ ] Remove `import Parse from 'parse'` statements
- [ ] Remove Parse SDK initialization code
