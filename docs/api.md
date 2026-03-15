# API Documentation

This document describes the API endpoints available in Manager.money.

## Base URL

- **Local Development:** `http://localhost:3000`
- **Production:** `https://manager.money`

## Authentication

Most admin endpoints require authentication. The API uses session-based authentication via Auth.js.

### Auth Status

Check which authentication providers are enabled.

```
GET /api/auth/status
```

**Response:**
```json
{
  "providers": {
    "google": true,
    "credentials": false
  }
}
```

---

## Authentication Endpoints

### NextAuth Handler

Handles all NextAuth.js authentication flows (sign-in, sign-out, callbacks).

```
GET/POST /api/auth/[...nextauth]
```

### Register User

Create a new user account with email and password.

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

**Response (Error):**
```json
{
  "error": "An account with this email already exists"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid input (email or password)
- `403` - Registration disabled
- `409` - Email already exists
- `500` - Server error
- `503` - Database not available

---

## Admin Endpoints

All admin endpoints require authentication and admin role (except GET requests which only require authentication).

### Feature Flags

#### Get All Flags

```
GET /api/admin/flags
```

**Response:**
```json
{
  "module_ev": true,
  "module_living_cost": true,
  "module_savings": true,
  "auth_google": false,
  "auth_credentials": false
}
```

#### Update Flags

```
PUT /api/admin/flags
```

**Request Body:**
```json
{
  "module_ev": true,
  "module_living_cost": true,
  "module_savings": false,
  "auth_google": true,
  "auth_credentials": true
}
```

**Response:**
```json
{
  "success": true,
  "flags": { ... },
  "persisted": true
}
```

**Note:** `persisted: false` indicates KV storage is not available (local development without Cloudflare bindings).

#### Seed Default Flags

Initialize feature flags with default values.

```
POST /api/admin/flags
```

**Response:**
```json
{
  "success": true,
  "flags": {
    "module_ev": true,
    "module_living_cost": true,
    "module_savings": true,
    "auth_google": false,
    "auth_credentials": false
  }
}
```

---

### User Management

#### List All Users

```
GET /api/admin/users
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "image": "https://...",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get User by ID

```
GET /api/admin/users/[id]
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "image": null,
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `403` - Not admin
- `404` - User not found
- `503` - Database not available

#### Update User

```
PATCH /api/admin/users/[id]
```

**Request Body:**
```json
{
  "role": "admin",
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "admin"
  }
}
```

**Updatable Fields:**
- `role` - "user" or "admin"
- `name` - User's display name

#### Delete User

```
DELETE /api/admin/users/[id]
```

**Response:**
```json
{
  "success": true
}
```

**Note:** Users cannot delete their own account.

**Status Codes:**
- `200` - Success
- `400` - Cannot delete self
- `401` - Not authenticated
- `403` - Not admin
- `404` - User not found
- `503` - Database not available

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message here"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Not authenticated |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `500` | Internal Server Error |
| `503` | Service Unavailable - Database/KV not available |

---

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider adding rate limiting via Cloudflare or application-level middleware.

---

## CORS

The API is designed to be accessed from the same origin. Cross-origin requests are not supported by default.
