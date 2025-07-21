# Environment Variables Setup Guide

This guide explains what each environment variable does and how to get the values you need for your ResponsiveFusionUI Skill Swap application.

## 🔧 Required Variables (Must Set These)

### 1. DATABASE_URL
**What it is**: Connection string to your PostgreSQL database
**Current**: Already set up with your Neon database
**How to get**: 
- Go to [Neon.tech](https://neon.tech)
- Sign in to your dashboard
- Select your project
- Go to "Connection Details"
- Copy the connection string

### 2. SESSION_SECRET
**What it is**: Secret key for encrypting user sessions
**Current**: `your-secret-key-change-in-production-make-it-long-and-random`
**How to set**: 
```bash
# Generate a random secret (recommended)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
**⚠️ IMPORTANT**: Change this to a long, random string in production!

## 📧 Email Service (Highly Recommended)

Your app needs email for:
- User registration confirmations
- Password reset links
- Skill swap notifications
- Weekly digest emails

### Option 1: Gmail (Easiest for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Set these variables**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Option 2: SendGrid (Better for Production)

1. **Sign up** at [SendGrid](https://sendgrid.com)
2. **Create API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Full Access"
3. **Set these variables**:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## 🖼️ File Upload Service (Optional)

For user profile pictures and skill images:

### Option 1: Cloudinary (Recommended)

1. **Sign up** at [Cloudinary](https://cloudinary.com)
2. **Get credentials** from your dashboard
3. **Set these variables**:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Option 2: AWS S3

1. **Create AWS account** and S3 bucket
2. **Create IAM user** with S3 permissions
3. **Set these variables**:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## 🗺️ External APIs (Optional)

### Google Maps (for location features)
1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Enable** Maps JavaScript API
3. **Create** API key
4. **Set**:
```env
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Firebase (for push notifications)
1. **Create project** at [Firebase Console](https://console.firebase.google.com)
2. **Go to** Project Settings → Cloud Messaging
3. **Copy** Server Key
4. **Set**:
```env
FIREBASE_SERVER_KEY=your-firebase-server-key
```

## 🔒 Security & Monitoring (Optional)

### Sentry (Error Tracking)
1. **Sign up** at [Sentry](https://sentry.io)
2. **Create project**
3. **Copy DSN** from project settings
4. **Set**:
```env
SENTRY_DSN=your-sentry-dsn
```

### Google Analytics
1. **Create** GA4 property at [Google Analytics](https://analytics.google.com)
2. **Copy** Measurement ID
3. **Set**:
```env
GA_TRACKING_ID=your-ga-id
```

## 🚀 Quick Start (Minimum Setup)

For a basic working application, you only need:

1. **Keep your current DATABASE_URL** (already working)
2. **Change SESSION_SECRET** to a random string
3. **Set up Gmail SMTP** for emails (highly recommended)

```env
# Required
DATABASE_URL=your-current-neon-url
SESSION_SECRET=generate-a-long-random-string-here
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email (recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

## 🔄 Testing Your Setup

After setting up your environment variables:

1. **Restart your server**:
```bash
npm run dev
```

2. **Check the logs** for any connection errors

3. **Test email** by trying to register a new user

4. **Test file uploads** by updating a profile picture

## 🆘 Troubleshooting

### Email not working?
- Check if 2FA is enabled on Gmail
- Verify app password is correct (16 characters, no spaces)
- Check spam folder for test emails

### Database connection issues?
- Verify your Neon database is active
- Check if connection string is correct
- Ensure your IP is whitelisted (Neon usually allows all)

### File uploads failing?
- Check Cloudinary/AWS credentials
- Verify API keys have proper permissions
- Check file size limits

## 📝 Production Checklist

Before deploying to production:

- [ ] Change SESSION_SECRET to a strong random string
- [ ] Set NODE_ENV=production
- [ ] Use production database URL
- [ ] Set up proper SMTP service (not Gmail)
- [ ] Configure file upload service
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics
- [ ] Set proper CORS origins
- [ ] Enable rate limiting
