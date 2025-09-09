# KajChai Authentication API Documentation

## Overview
This document describes the authentication API endpoints for the KajChai platform. The system supports JWT-based authentication with HTTP-only secure cookies and email verification for user registration.

## Authentication Features
- ✅ JWT Token Authentication (30 minutes validity)
- ✅ HTTP-Only Secure Cookies
- ✅ Email Verification for Registration
- ✅ Role-based Authentication (Customer/Worker)
- ✅ Password Encryption (BCrypt)
- ✅ Spring Security Integration
- ✅ Supabase PostgreSQL Database

## Base URL
```
http://localhost:8080/api
```

## Authentication Endpoints

### 1. Initiate Signup
**POST** `/auth/signup/initiate`

Initiates the signup process by sending a verification code to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "CUSTOMER", // or "WORKER"
  "name": "John Doe",
  "phone": "+8801234567890",
  "gender": "Male",
  "city": "Dhaka",
  "upazila": "Dhanmondi",
  "district": "Dhaka",
  
  // Worker-specific fields (only for role: "WORKER")
  "field": "Plumbing", // required for workers
  "experience": 2.5    // required for workers
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "email": "user@example.com"
}
```

### 2. Complete Signup with Verification
**POST** `/auth/signup/verify?verificationCode=123456`

Completes the signup process after email verification.

**Request Body:** Same as initiate signup
**Query Parameter:** `verificationCode` (6-digit code from email)

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "email": "user@example.com",
  "role": "CUSTOMER"
}
```

### 3. Login
**POST** `/auth/login`

Authenticates a user and sets an HTTP-only JWT cookie.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "email": "user@example.com",
  "role": "CUSTOMER"
}
```

**Cookie Set:** `jwt` (HTTP-only, 30 minutes expiry)

### 4. Logout
**POST** `/auth/logout`

Clears the JWT cookie and logs out the user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 5. Get Current User
**GET** `/auth/me`

Returns information about the currently authenticated user.

**Headers:** `Cookie: jwt=<jwt-token>` (automatically sent by browser)

**Response:**
```json
{
  "success": true,
  "message": "User information retrieved successfully",
  "email": "user@example.com",
  "role": "CUSTOMER"
}
```

### 6. Resend Verification Code
**POST** `/auth/resend-verification?email=user@example.com`

Resends the verification code to the specified email.

**Query Parameter:** `email`

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

## Test Endpoints

### Public Endpoint
**GET** `/test/public`

Returns a public message (no authentication required).

### Protected Endpoints
**GET** `/test/protected` - Requires authentication
**GET** `/test/customer` - Requires CUSTOMER role  
**GET** `/test/worker` - Requires WORKER role

## User Roles

### CUSTOMER
Required fields during signup:
- email, password, name, phone, gender, city, upazila, district

### WORKER  
Required fields during signup:
- email, password, name, phone, gender, city, upazila, district, field, experience

## Database Tables Created

### 1. users
- user_id (Primary Key)
- email (Unique)
- password (Encrypted)
- role (CUSTOMER/WORKER)
- enabled, account_non_expired, account_non_locked, credentials_non_expired
- created_at

### 2. email_verification
- id (Primary Key)
- email
- verification_code (6-digit)
- expiry_date
- verified (boolean)
- created_at

### 3. Customer & Worker
- Existing tables are maintained for role-specific data

## Security Configuration
- JWT Secret: Configurable in application.properties
- JWT Expiry: 30 minutes (1800000 ms)
- Email Verification Expiry: 5 minutes (300000 ms)
- Password Encryption: BCrypt
- CORS: Enabled for frontend integration

## Email Configuration
- SMTP: Gmail (smtp.gmail.com:587)
- From Address: kajchai.team@gmail.com
- Verification emails are sent automatically during signup

## Error Handling
All endpoints return structured JSON responses with:
- `success`: boolean
- `message`: descriptive message
- Additional fields based on the endpoint

## Frontend Integration
The authentication system uses HTTP-only cookies for security. Frontend applications should:
1. Make requests to the API endpoints
2. Handle success/error responses
3. Cookies are automatically managed by the browser
4. Check authentication status using `/auth/me`

## Testing the API
You can test the API using tools like Postman, curl, or integrate with your frontend application. The application is now running on `http://localhost:8080`.

Example curl commands:

```bash
# Test public endpoint
curl http://localhost:8080/api/test/public

# Initiate signup
curl -X POST http://localhost:8080/api/auth/signup/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "CUSTOMER",
    "name": "John Doe",
    "phone": "+8801234567890",
    "gender": "Male",
    "city": "Dhaka",
    "upazila": "Dhanmondi",
    "district": "Dhaka"
  }'
```

**Note:** For HTTPS deployment, enable the `jwtCookie.setSecure(true)` line in the AuthController for production use.
