# KajChai Full-Stack Authentication System

A complete authentication system built with **Spring Boot** backend and **React** frontend, featuring JWT authentication, email verification, and role-based access control.

## 🌟 Features

### Backend (Spring Boot)
- ✅ **JWT Authentication** - 30-minute token validity
- ✅ **HTTP-Only Secure Cookies** - Enhanced security
- ✅ **Email Verification** - 6-digit code verification
- ✅ **Role-Based Authentication** - Customer & Worker roles
- ✅ **Password Encryption** - BCrypt hashing
- ✅ **Spring Security Integration** - Complete security setup
- ✅ **Supabase PostgreSQL** - Cloud database integration
- ✅ **CORS Configuration** - Frontend-backend communication

### Frontend (React + Vite)
- ✅ **React 19** - Latest React features
- ✅ **React Router Dom** - Client-side routing
- ✅ **Axios HTTP Client** - API communication
- ✅ **Context API** - State management
- ✅ **Responsive Design** - Mobile-friendly UI
- ✅ **Form Validation** - Client-side validation
- ✅ **Protected Routes** - Role-based route protection
- ✅ **Modern CSS** - Gradient designs and animations

## 🚀 Quick Start

### Prerequisites
- ✅ Java 21+
- ✅ Node.js 18+
- ✅ Maven
- ✅ Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd KajChai
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd KajChaiBackend
```

#### Configure Database & Email
The application is pre-configured with:
- **Database**: Supabase PostgreSQL
- **Email**: Gmail SMTP (kajchai.team@gmail.com)

#### Start Backend Server
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

Backend will start on: **http://localhost:8080**

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../KajChaiFrontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Frontend Server
```bash
npm run dev
```

Frontend will start on: **http://localhost:5173**

## 🖥️ Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React application |
| **Backend API** | http://localhost:8080/api | Spring Boot REST API |
| **API Docs** | [AUTHENTICATION_API_DOCS.md](./AUTHENTICATION_API_DOCS.md) | Complete API documentation |

## 📱 User Interface

### Landing Page
- Automatic redirect to dashboard if logged in
- Redirect to login if not authenticated

### Login Page (`/login`)
- Email and password authentication
- Secure cookie-based session management
- Error handling and validation

### Signup Page (`/signup`)
- Two-step process:
  1. **Step 1**: Fill registration form
  2. **Step 2**: Email verification with 6-digit code
- Role selection (Customer/Worker)
- Different fields for different roles
- Form validation and error handling

### Dashboard (`/dashboard`)
- Personalized welcome message
- User information display
- API connectivity tests
- Role-based content
- Logout functionality

## 👥 User Roles

### Customer Account
**Required Fields:**
- Email, Password, Name, Phone
- Gender, City, Upazila, District

**Access:**
- Customer dashboard
- Customer-specific endpoints
- General protected routes

### Worker Account
**Required Fields:**
- All Customer fields +
- Field of Work (e.g., Plumbing, Electrical)
- Years of Experience

**Access:**
- Worker dashboard
- Worker-specific endpoints
- General protected routes

## 🔐 Authentication Flow

### Registration Process
1. **User fills signup form** → Selects role and enters details
2. **System validation** → Checks for existing users
3. **Email verification** → 6-digit code sent to email
4. **Code verification** → User enters verification code
5. **Account creation** → User and role-specific records created
6. **Redirect to login** → Ready to sign in

### Login Process
1. **User enters credentials** → Email and password
2. **Server authentication** → Validates credentials
3. **JWT token generation** → Creates 30-minute token
4. **Cookie setting** → HTTP-only secure cookie
5. **Dashboard redirect** → Successful authentication

### Session Management
- **Automatic authentication check** on app load
- **Token validation** on protected routes
- **Automatic logout** on token expiry
- **Secure cookie handling** by browser

## 🛡️ Security Features

### Backend Security
- **JWT Secret Key** configuration
- **Password encryption** with BCrypt
- **CSRF protection** disabled for API
- **CORS configuration** for cross-origin requests
- **Input validation** with Bean Validation
- **SQL injection prevention** with JPA

### Frontend Security
- **HTTP-only cookies** - Not accessible via JavaScript
- **Secure cookie flags** - Ready for HTTPS
- **XSS prevention** - React's built-in protection
- **Form validation** - Client-side validation
- **Route protection** - Authentication required

## 🗄️ Database Schema

### Core Tables
- **`users`** - Main authentication table
- **`email_verification`** - Email verification codes
- **`customer`** - Customer-specific data
- **`worker`** - Worker-specific data

All tables are auto-created by Hibernate on first run.

## 🚀 API Endpoints

### Authentication Endpoints
```
POST /api/auth/signup/initiate     # Start signup process
POST /api/auth/signup/verify       # Complete signup
POST /api/auth/login               # User login
POST /api/auth/logout              # User logout
GET  /api/auth/me                  # Get current user
POST /api/auth/resend-verification # Resend verification code
```

### Test Endpoints
```
GET /api/test/public               # Public access
GET /api/test/protected            # Requires login
GET /api/test/customer             # Customer role only
GET /api/test/worker               # Worker role only
```

Full API documentation: [AUTHENTICATION_API_DOCS.md](./AUTHENTICATION_API_DOCS.md)

## 🔧 Configuration

### Backend Configuration (`application.properties`)
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://[supabase-url]
spring.datasource.username=postgres.[project-ref]
spring.datasource.password=[your-password]

# JWT Configuration
jwt.secret=[your-jwt-secret]
jwt.expiration=1800000  # 30 minutes

# Email Configuration
spring.mail.username=kajchai.team@gmail.com
spring.mail.password=[app-password]
```

### Frontend Configuration (`authService.js`)
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

## 📦 Project Structure

```
KajChai/
├── KajChaiBackend/          # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/example/KajChai/
│   │       ├── Controller/   # REST Controllers
│   │       ├── Service/      # Business Logic
│   │       ├── Repository/   # Data Access
│   │       ├── Security/     # Security Configuration
│   │       ├── DatabaseEntity/ # JPA Entities
│   │       └── DTO/         # Data Transfer Objects
│   └── src/main/resources/
│       └── application.properties
│
├── KajChaiFrontend/         # React Frontend
│   ├── src/
│   │   ├── components/      # React Components
│   │   ├── contexts/        # React Context
│   │   ├── services/        # API Services
│   │   └── App.jsx         # Main App Component
│   └── package.json
│
└── AUTHENTICATION_API_DOCS.md # API Documentation
```

## 🧪 Testing the Application

### 1. Test Public Endpoint
```bash
curl http://localhost:8080/api/test/public
```

### 2. Test User Registration
```bash
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

### 3. Frontend Testing
1. Open http://localhost:5173
2. Try registering a new account
3. Check email for verification code
4. Complete registration and login
5. Test dashboard functionality

## 🚀 Production Deployment

### Backend Deployment
1. **Enable HTTPS** in production
2. **Update JWT secret** with a secure key
3. **Configure production database**
4. **Set up email service** with production credentials
5. **Enable secure cookie flags**

### Frontend Deployment
1. **Update API_BASE_URL** to production backend
2. **Build for production**: `npm run build`
3. **Deploy dist folder** to hosting service
4. **Configure CORS** on backend for production domain

### Security Checklist
- ✅ HTTPS enabled
- ✅ Secure JWT secret
- ✅ Production database credentials
- ✅ Email service configured
- ✅ CORS properly configured
- ✅ Environment variables secured

## 🐛 Troubleshooting

### Common Issues

**Email Authentication Failed:**
- Ensure Gmail App Password is used instead of regular password
- Check if 2FA is enabled on Gmail account

**CORS Errors:**
- Verify frontend URL in CORS configuration
- Check if withCredentials is set to true in axios

**Database Connection Failed:**
- Verify Supabase connection string
- Check database password and username

**JWT Token Issues:**
- Verify JWT secret configuration
- Check token expiration settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🎉 Congratulations!

You now have a fully functional authentication system with:
- ✅ **Secure JWT authentication**
- ✅ **Email verification**
- ✅ **Role-based access control**
- ✅ **Modern React frontend**
- ✅ **Spring Boot backend**
- ✅ **Production-ready architecture**

**Happy Coding! 🚀**