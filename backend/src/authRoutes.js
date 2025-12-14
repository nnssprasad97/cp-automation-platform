// OAuth Routes for CP Automation Platform
const express = require('express');
const router = express.Router();
const { OAuthService } = require('./platformServices');
const User = require('../models/User');

const oauthService = new OAuthService();

// ============ GITHUB OAUTH ============
router.get('/auth/github', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;
  const authUrl = oauthService.getAuthUrl('github', state);
  res.redirect(authUrl);
});

router.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  try {
    const tokenData = await oauthService.exchangeCode('github', code);
    if (!tokenData || !tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Fetch user info from GitHub
    const axios = require('axios');
    const response = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    // Find or create user
    let user = await User.findOne({ githubId: response.data.id });
    if (!user) {
      user = await User.create({
        githubId: response.data.id,
        username: response.data.login,
        email: response.data.email,
        avatarUrl: response.data.avatar_url,
        accessToken: tokenData.access_token
      });
    } else {
      user.accessToken = tokenData.access_token;
      await user.save();
    }

    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============ DISCORD OAUTH ============
router.get('/auth/discord', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;
  const authUrl = oauthService.getAuthUrl('discord', state);
  res.redirect(authUrl);
});

router.get('/auth/discord/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  try {
    const tokenData = await oauthService.exchangeCode('discord', code);
    if (!tokenData || !tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Fetch user info from Discord
    const axios = require('axios');
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    // Find or update user
    let user = await User.findOne({ discordId: response.data.id });
    if (!user) {
      user = await User.create({
        discordId: response.data.id,
        username: response.data.username,
        email: response.data.email,
        avatarUrl: response.data.avatar,
        discordAccessToken: tokenData.access_token,
        discordWebhook: process.env.DISCORD_WEBHOOK_URL
      });
    } else {
      user.discordAccessToken = tokenData.access_token;
      await user.save();
    }

    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Discord OAuth Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============ CONNECT CODEFORCES ============
router.post('/connect/codeforces', async (req, res) => {
  try {
    const { handle } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify the handle exists
    const { CodeForcesService } = require('./platformServices');
    const cfService = new CodeForcesService();
    const submissions = await cfService.getUserSubmissions(handle);

    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ error: 'CodeForces handle not found' });
    }

    // Update user with CodeForces handle
    const user = await User.findById(userId);
    user.codeforcesHandle = handle;
    await user.save();

    res.json({ message: 'CodeForces connected', handle });
  } catch (error) {
    console.error('CodeForces Connection Error:', error);
    res.status(500).json({ error: 'Failed to connect CodeForces' });
  }
});

// ============ CONNECT CODECHEF ============
router.post('/connect/codechef', async (req, res) => {
  try {
    const { handle } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Update user with CodeChef handle
    const user = await User.findById(userId);
    user.codechefHandle = handle;
    await user.save();

    res.json({ message: 'CodeChef connected', handle });
  } catch (error) {
    console.error('CodeChef Connection Error:', error);
    res.status(500).json({ error: 'Failed to connect CodeChef' });
  }
});

// ============ CONNECT LEETCODE ============
router.post('/connect/leetcode', async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify the username exists
    const { LeetCodeService } = require('./platformServices');
    const lcService = new LeetCodeService();
    const profile = await lcService.getUserProfile(username);

    if (!profile) {
      return res.status(404).json({ error: 'LeetCode username not found' });
    }

    // Update user with LeetCode username
    const user = await User.findById(userId);
    user.leetcodeUsername = username;
    await user.save();

    res.json({ message: 'LeetCode connected', username });
  } catch (error) {
    console.error('LeetCode Connection Error:', error);
    res.status(500).json({ error: 'Failed to connect LeetCode' });
  }
});

// ============ UPDATE NOTIFICATION PREFERENCES ============
router.post('/preferences/notifications', async (req, res) => {
  try {
    const userId = req.session.userId;
    const { methods, email, phoneNumber, discordWebhook } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    user.notificationMethods = methods || ['email'];
    user.phoneNumber = phoneNumber;
    user.discordWebhook = discordWebhook;
    await user.save();

    res.json({ message: 'Notification preferences updated' });
  } catch (error) {
    console.error('Preferences Update Error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ============ LOGOUT ============
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
