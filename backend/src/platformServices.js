// Platform Services for CP Automation Platform
// Handles OAuth, Contest Alerts, Notifications

const axios = require('axios');
const nodemailer = require('nodemailer');

// ============ CODEFORCES SERVICE ============
class CodeForcesService {
  constructor() {
    this.baseURL = 'https://codeforces.com/api';
  }

  async fetchContests() {
    try {
      const response = await axios.get(`${this.baseURL}/contest.list`);
      return response.data.result.filter(c => c.phase === 'BEFORE');
    } catch (error) {
      console.error('CodeForces API Error:', error.message);
      return [];
    }
  }

  async getUserSubmissions(handle) {
    try {
      const response = await axios.get(`${this.baseURL}/user.status`, {
        params: { handle, from: 1, count: 10 }
      });
      return response.data.result;
    } catch (error) {
      console.error('CodeForces User Error:', error.message);
      return [];
    }
  }
}

// ============ CODECHEF SERVICE ============
class CodeChefService {
  constructor() {
    this.baseURL = 'https://api.codechef.com';
  }

  async fetchContests() {
    try {
      const response = await axios.get(`${this.baseURL}/contests`, {
        headers: { 'Accept': 'application/json' }
      });
      return response.data.result || [];
    } catch (error) {
      console.error('CodeChef API Error:', error.message);
      return [];
    }
  }

  async getContestDetails(contestCode) {
    try {
      const response = await axios.get(`${this.baseURL}/contests/${contestCode}`);
      return response.data.result;
    } catch (error) {
      console.error('CodeChef Contest Error:', error.message);
      return null;
    }
  }
}

// ============ LEETCODE SERVICE ============
class LeetCodeService {
  constructor() {
    this.baseURL = 'https://leetcode.com/graphql';
  }

  async fetchContests() {
    try {
      const query = `{
        allContests {
          id
          title
          startTime
          duration
          isVirtual
        }
      }`;
      const response = await axios.post(this.baseURL, { query });
      return response.data.data?.allContests || [];
    } catch (error) {
      console.error('LeetCode API Error:', error.message);
      return [];
    }
  }

  async getUserProfile(username) {
    try {
      const response = await axios.get(`https://leetcode.com/api/users/${username}/profile/`);
      return response.data;
    } catch (error) {
      console.error('LeetCode Profile Error:', error.message);
      return null;
    }
  }
}

// ============ OAUTH SERVICE ============
class OAuthService {
  constructor() {
    this.providers = {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI,
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token'
      },
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        redirectUri: process.env.DISCORD_REDIRECT_URI,
        authUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token'
      }
    };
  }

  getAuthUrl(provider, state) {
    const config = this.providers[provider];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: provider === 'github' ? 'user:email' : 'identify',
      state
    });
    return `${config.authUrl}?${params.toString()}`;
  }

  async exchangeCode(provider, code) {
    try {
      const config = this.providers[provider];
      const response = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri
      });
      return response.data;
    } catch (error) {
      console.error('OAuth Exchange Error:', error.message);
      return null;
    }
  }
}

// ============ NOTIFICATION SERVICE ============
class NotificationService {
  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });
  }

  async sendEmailNotification(email, subject, message) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject,
        html: `<h2>${subject}</h2><p>${message}</p>`
      });
      console.log(`Email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Email Error:', error.message);
      return false;
    }
  }

  async sendWhatsAppNotification(phoneNumber, message) {
    // Using Twilio for WhatsApp
    try {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await twilio.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phoneNumber}`,
        body: message
      });
      console.log(`WhatsApp sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('WhatsApp Error:', error.message);
      return false;
    }
  }

  async sendDiscordNotification(webhookUrl, message) {
    try {
      await axios.post(webhookUrl, {
        content: message,
        tts: false
      });
      console.log('Discord notification sent');
      return true;
    } catch (error) {
      console.error('Discord Error:', error.message);
      return false;
    }
  }
}

// ============ CONTEST ALERT SERVICE ============
class ContestAlertService {
  constructor() {
    this.codeForcesService = new CodeForcesService();
    this.codeChefService = new CodeChefService();
    this.leetCodeService = new LeetCodeService();
    this.notificationService = new NotificationService();
  }

  async checkAndAlertContests(userPreferences) {
    try {
      const contests = [];
      
      if (userPreferences.platforms.includes('codeforces')) {
        const cfContests = await this.codeForcesService.fetchContests();
        contests.push(...cfContests.map(c => ({ ...c, platform: 'CodeForces' })));
      }
      
      if (userPreferences.platforms.includes('codechef')) {
        const ccContests = await this.codeChefService.fetchContests();
        contests.push(...ccContests.map(c => ({ ...c, platform: 'CodeChef' })));
      }
      
      if (userPreferences.platforms.includes('leetcode')) {
        const lcContests = await this.leetCodeService.fetchContests();
        contests.push(...lcContests.map(c => ({ ...c, platform: 'LeetCode' })));
      }

      // Send alerts based on preferences
      for (const contest of contests) {
        const message = `🎯 ${contest.platform} Contest Alert!\nTitle: ${contest.title || contest.name}\nTime: ${new Date(contest.startTime * 1000).toLocaleString()}`;
        
        if (userPreferences.notificationMethods.includes('email')) {
          await this.notificationService.sendEmailNotification(
            userPreferences.email,
            'Contest Alert',
            message
          );
        }
        
        if (userPreferences.notificationMethods.includes('whatsapp') && userPreferences.phoneNumber) {
          await this.notificationService.sendWhatsAppNotification(
            userPreferences.phoneNumber,
            message
          );
        }
        
        if (userPreferences.notificationMethods.includes('discord') && userPreferences.discordWebhook) {
          await this.notificationService.sendDiscordNotification(
            userPreferences.discordWebhook,
            message
          );
        }
      }

      return contests;
    } catch (error) {
      console.error('Contest Alert Error:', error.message);
      return [];
    }
  }
}

// ============ EXPORTS ============
module.exports = {
  CodeForcesService,
  CodeChefService,
  LeetCodeService,
  OAuthService,
  NotificationService,
  ContestAlertService
};
