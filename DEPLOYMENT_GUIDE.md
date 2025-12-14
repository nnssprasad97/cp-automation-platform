# CP Automation Platform - Deployment Guide

## 🚀 Complete Deployment Instructions

This guide will help you deploy the CP Automation Platform to Render.com free tier in production.

---

## Prerequisites

- GitHub account (repository already created)
- Render.com free account (https://render.com)
- MongoDB Atlas free account (https://mongodb.com/cloud/atlas)
- OAuth credentials for GitHub and Discord
- Email account for Gmail SMTP (or any SMTP service)
- Twilio account for WhatsApp notifications (optional)

---

## Step 1: Setup MongoDB Atlas Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up and create a free account
3. Create a new project
4. Create a free cluster (M0)
5. Set username and password
6. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
7. Add IP 0.0.0.0/0 to IP Whitelist (for Render access)

---

## Step 2: Setup OAuth Credentials

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App with:
   - Application name: `CP Automation Platform`
   - Homepage URL: `https://cp-automation-frontend.onrender.com`
   - Authorization callback URL: `https://cp-automation-backend.onrender.com/api/auth/github/callback`
3. Copy Client ID and Client Secret

### Discord OAuth
1. Go to Discord Developer Portal (https://discord.com/developers/applications)
2. Create new application: `CP Automation Platform`
3. In OAuth2 settings, add redirect URLs:
   - `https://cp-automation-backend.onrender.com/api/auth/discord/callback`
4. Copy Client ID and Client Secret

---

## Step 3: Deploy to Render.com

### Method 1: Using Render Dashboard (Recommended)

1. Go to https://render.com and sign in
2. Click "New" > "Web Service"
3. Select "GitHub" and authorize
4. Select repository: `nnssprasad97/cp-automation-platform`
5. Configure service:
   - Name: `cp-automation-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Plan: `Free`

6. Click "Create Web Service"
7. Add environment variables in Settings:
   - `MONGODB_URI` = Your MongoDB connection string
   - `GITHUB_CLIENT_ID` = Your GitHub OAuth ID
   - `GITHUB_CLIENT_SECRET` = Your GitHub OAuth Secret
   - `DISCORD_CLIENT_ID` = Your Discord OAuth ID
   - `DISCORD_CLIENT_SECRET` = Your Discord OAuth Secret
   - `GMAIL_USER` = Your Gmail address
   - `GMAIL_PASSWORD` = Your Gmail app password
   - `JWT_SECRET` = Generate random string
   - `SESSION_SECRET` = Generate random string

8. Create another service for frontend:
   - Name: `cp-automation-frontend`
   - Build Command: `cd frontend && npm install && npm run build`
   - Start Command: `cd frontend && npm start`
   - Environment variable: `REACT_APP_API_URL` = `https://cp-automation-backend.onrender.com/api`

### Method 2: Using render.yaml (Automatic)

1. Push code to GitHub
2. In Render Dashboard, click "New" > "Blueprint"
3. Connect your GitHub repository
4. Select `render.yaml`
5. Fill in environment variables
6. Deploy

---

## Step 4: Configure OAuth Redirect URIs (Update)

After deployment, your services will have URLs like:
- Backend: `https://cp-automation-backend.onrender.com`
- Frontend: `https://cp-automation-frontend.onrender.com`

Update OAuth redirect URIs in:
- GitHub OAuth App > Authorization callback URLs
- Discord Developer Portal > OAuth2 Redirects

---

## Step 5: Create Discord Webhook (Optional)

1. In your Discord server, create a webhook channel
2. Settings > Integrations > Webhooks > Create Webhook
3. Copy webhook URL
4. Add to Render environment: `DISCORD_WEBHOOK_URL`

---

## Step 6: Test the Deployment

### Backend Health Check
```bash
curl https://cp-automation-backend.onrender.com/api/health
```

### Test OAuth Flow
1. Visit frontend URL
2. Click "Login with GitHub"
3. Authorize application
4. Should redirect to dashboard

### Test Contest Alerts
1. Login to application
2. Connect CodeForces handle
3. Enable notifications
4. Application should fetch upcoming contests

---

## Step 7: Monitor Logs

1. In Render Dashboard, select your service
2. Click "Logs" tab
3. Watch real-time logs during testing

---

## Free Tier Limitations

- Services spin down after 15 minutes of inactivity (free plan)
- First request after spin-down takes 30+ seconds
- Database free tier has 512MB storage limit
- Suitable for development/testing

### For Production:
- Upgrade Render plan (minimum $7/month for always-on service)
- Use MongoDB paid tier for better performance

---

## Troubleshooting

### Services won't start
- Check logs in Render Dashboard
- Verify `npm install` works locally
- Ensure `package.json` is in root of subdirectory

### Database connection fails
- Verify MongoDB URI in env vars
- Check IP whitelist includes 0.0.0.0/0
- Test connection string locally

### OAuth redirect fails
- Update OAuth app redirect URLs
- Clear browser cookies
- Check callback URL matches exactly

### Notifications not working
- Verify Gmail credentials are correct
- Use app-specific password (not regular password)
- Check Twilio credentials if using WhatsApp

---

## Performance Tips

1. Upgrade to paid Render plan for always-on service
2. Use database indexing for MongoDB queries
3. Implement caching for contest data
4. Use CDN for frontend assets
5. Monitor and optimize API response times

---

## Next Steps

1. Setup automated GitHub actions for CI/CD
2. Add database backups
3. Implement email templates
4. Add rate limiting to API
5. Setup error logging (Sentry, LogRocket)
6. Implement WebSocket for real-time updates

---

## Support & Resources

- Render Docs: https://render.com/docs
- MongoDB Docs: https://docs.mongodb.com
- Express.js Docs: https://expressjs.com
- React Docs: https://react.dev
- GitHub OAuth: https://docs.github.com/en/developers/apps
- Discord OAuth: https://discord.com/developers/docs/topics/oauth2

---

**Happy Deploying! 🎉**
