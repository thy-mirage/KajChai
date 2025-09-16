# Environment Setup Guide

## Setting up Groq API Key

The application uses the Groq API for LLM functionality. To secure the API key, it's configured as an environment variable.

### For Development

#### Windows (PowerShell)
```powershell
$env:GROQ_API_KEY="your-actual-groq-api-key-here"
```

#### Windows (Command Prompt)
```cmd
set GROQ_API_KEY=your-actual-groq-api-key-here
```

#### Linux/Mac
```bash
export GROQ_API_KEY="your-actual-groq-api-key-here"
```

### For Production

Set the environment variable in your deployment platform:

- **Docker**: Add to your `docker-compose.yml` or Docker run command
- **AWS**: Set in Elastic Beanstalk environment configuration
- **Heroku**: Use `heroku config:set GROQ_API_KEY="your-key"`
- **Other platforms**: Refer to their documentation for setting environment variables

### Configuration File Setup

1. Copy `application.properties.example` to `application.properties`
2. Replace placeholder values with your actual credentials
3. Set the `GROQ_API_KEY` environment variable before running the application

### Note

The `application.properties` file is ignored by Git to prevent accidental exposure of sensitive data. Only the `.example` file should be committed to version control.