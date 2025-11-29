# FormGenius Setup Guide

This guide will help you set up FormGenius for development.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **PostgreSQL** database running
- **Google Cloud Project** with OAuth 2.0 credentials
- **Google Gemini API** key
- **Git** for version control

## Step-by-Step Setup

### 1. Google Cloud Setup

#### Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Set authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Save your **Client ID** and **Client Secret**

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy the API key for later use

### 3. Database Setup

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb formgenius

# Your DATABASE_URL will be:
# postgresql://your-username@localhost:5432/formgenius
```

#### Option B: Cloud Database (Recommended for Production)

Use one of these providers:
- [Supabase](https://supabase.com/) - Free tier available
- [Neon](https://neon.tech/) - Serverless Postgres
- [Railway](https://railway.app/) - Easy deployment

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:

```env
# Database - Replace with your connection string
DATABASE_URL="postgresql://user:password@localhost:5432/formgenius"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Google OAuth - From Google Cloud Console
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Gemini AI - From Google AI Studio
GEMINI_API_KEY="your-gemini-api-key"

# Redis (Optional for development)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Initialize Database

```bash
# Push schema to database
npm run db:push

# Or create a migration
npm run db:migrate
```

### 7. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Verify Setup

### Test Authentication
1. Click "Sign In" on the homepage
2. Sign in with Google
3. You should be redirected back to the application

### Test Database
```bash
# Open Prisma Studio to view database
npm run db:studio
```

### Test AI Features (via API)

```bash
# Test question generation
curl -X POST http://localhost:3000/api/ai/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "JavaScript Basics",
    "formType": "QUIZ",
    "difficulty": "medium",
    "numberOfQuestions": 5,
    "includeAnswerKey": true
  }'
```

## Common Issues

### Database Connection Error
```
Error: Can't reach database server at `localhost:5432`
```
**Solution**: Ensure PostgreSQL is running
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### NextAuth Error: "No secret provided"
```
Error: Please define a `secret`
```
**Solution**: Generate and set NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Google OAuth Error
```
Error: redirect_uri_mismatch
```
**Solution**: Verify the redirect URI in Google Cloud Console matches exactly:
```
http://localhost:3000/api/auth/callback/google
```

### Gemini API Error
```
Error: API key not valid
```
**Solution**: Verify your API key is correct and the Gemini API is enabled

### Prisma Generate Error
```
Error: Generator "client" could not be found
```
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## Optional: Redis Setup (for Background Jobs)

### Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in project settings
5. Deploy

### Environment Variables for Production

Ensure these are set in your production environment:
- `DATABASE_URL` - Production database connection string
- `NEXTAUTH_URL` - Your production URL (e.g., https://formgenius.com)
- `NEXTAUTH_SECRET` - Different from development
- `GOOGLE_CLIENT_ID` - Production OAuth credentials
- `GOOGLE_CLIENT_SECRET` - Production OAuth secret
- `GEMINI_API_KEY` - Your Gemini API key
- `REDIS_HOST` - Production Redis host (if using)

### Post-Deployment

1. Run database migrations:
```bash
npx prisma migrate deploy
```

2. Test OAuth callback with production URL

3. Monitor logs for any errors

## Next Steps

1. Read the [README.md](./README.md) for feature overview
2. Explore the API routes in `src/app/api/`
3. Check out the AI services in `src/lib/ai/`
4. Build your first form!

## Getting Help

- Check the [README.md](./README.md) for general information
- Review the [Database Schema](./prisma/schema.prisma)
- Join our Discord community (link in README)
- Email: support@formgenius.com

## Development Tips

1. **Use Prisma Studio** for database inspection:
   ```bash
   npm run db:studio
   ```

2. **Check API logs** in the terminal where `npm run dev` is running

3. **Use TypeScript strictly** - The project uses strict mode

4. **Test AI features** with different prompts to understand behavior

5. **Monitor API usage** - Gemini API has rate limits

Happy coding! 🚀
