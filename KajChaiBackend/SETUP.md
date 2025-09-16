# 🚀 KajChai Backend Setup Guide

## For New Developers

### 1. Clone the repository
```bash
git clone https://github.com/thy-mirage/KajChai.git
cd KajChai/KajChaiBackend
```

### 2. Set up environment variables
```bash
# Copy the example .env file
copy .env.example .env
```

### 3. Get the actual .env file
**Contact the project owner to get the actual `.env` file with real credentials.**

The `.env` file should contain:
- Database credentials
- AWS S3 credentials  
- Email configuration
- Cloudinary API keys
- Groq API key
- JWT secret

### 4. Install dependencies and run
```bash
# Install dependencies (Maven will handle this)
./mvnw clean install

# Run the application
./mvnw spring-boot:run
```

### 5. Verify setup
- Backend should start on: `http://localhost:8080`
- Test endpoint: `http://localhost:8080/api/test/public`

## Files to Know

| File | Purpose | Git Status |
|------|---------|------------|
| `.env` | Contains all sensitive credentials | ❌ **Ignored by Git** |
| `.env.example` | Template showing required variables | ✅ **Committed to Git** |
| `application.properties` | Spring Boot configuration using .env variables | ✅ **Committed to Git** |

## Daily Development

1. Make sure you have the `.env` file
2. Run: `./mvnw spring-boot:run`
3. Backend will automatically load environment variables from `.env`

## Troubleshooting

**App won't start?**
- Check if `.env` file exists in the backend root directory
- Verify all required variables are set in `.env`
- Contact project owner for the correct `.env` file

**Need help?**
Contact the project maintainer for the `.env` file and any setup assistance.