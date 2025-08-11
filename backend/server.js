const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: process.env.ES_USER || 'elastic',
    password: process.env.ES_PASS || 'f1KxdjdqCZ7jEfjiMpFg',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const INDEX = 'users';
const AUTH_INDEX = 'auth_users';
const SEARCH_HISTORY_INDEX = 'search_history';

// Helper function to ensure auth_users index exists
async function ensureAuthIndexExists() {
  try {
    const { body: exists } = await esClient.indices.exists({ index: AUTH_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: AUTH_INDEX,
        body: {
          mappings: {
            properties: {
              email: { type: 'keyword' },
              password: { type: 'keyword' },
              name: { type: 'text' }
            },
          },
        },
      });
      console.log(`Created index ${AUTH_INDEX}`);
    }
  } catch (err) {
    if (
      err.meta &&
      err.meta.body &&
      err.meta.body.error &&
      err.meta.body.error.type === 'resource_already_exists_exception'
    ) {
      return;
    }
    throw err;
  }
}

// Helper function to ensure search_history index exists
async function ensureSearchHistoryIndexExists() {
  try {
    const { body: exists } = await esClient.indices.exists({ index: SEARCH_HISTORY_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: SEARCH_HISTORY_INDEX,
        body: {
          mappings: {
            properties: {
              userId: { type: 'keyword' },
              query: { type: 'text' },
              timestamp: { type: 'date' },
              resultsCount: { type: 'integer' }
            },
          },
        },
      });
      console.log(`Created index ${SEARCH_HISTORY_INDEX}`);
    }
  } catch (err) {
    if (
      err.meta &&
      err.meta.body &&
      err.meta.body.error &&
      err.meta.body.error.type === 'resource_already_exists_exception'
    ) {
      return;
    }
    throw err;
  }
}

// ===== Authentication Routes =====

// Register new user — now properly includes name
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Missing email or password' });

  try {
    await ensureAuthIndexExists();

    const existingUser = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email } },
    });

    if (existingUser.hits.total.value > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const result = await esClient.index({
      index: AUTH_INDEX,
      document: {
        email,
        password,
        name: name && name.trim() !== '' ? name.trim() : ''
      },
    });

    await esClient.indices.refresh({ index: AUTH_INDEX });

    res.status(201).json({ success: true, id: result._id });
  } catch (err) {
    console.error('Error creating user:', err.meta?.body || err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login - return complete user data including name
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Missing email or password' });

  try {
    await ensureAuthIndexExists();

    const result = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email } },
      size: 1,
    });

    if (result.hits.total.value === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.hits.hits[0];
    const userData = user._source;

    if (password !== userData.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: userData.email },
      process.env.JWT_SECRET || 'super-secret-key',
      { expiresIn: '1h' }
    );

    res.json({
      email: userData.email,
      token,
      name: userData.name || '',
      id: user._id
    });
  } catch (err) {
    console.error('Login error:', err.meta?.body || err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== Profile Management Endpoints =====

// Get user profile
app.get('/profile/:email', async (req, res) => {
  const emailParam = req.params.email;

  try {
    const searchResult = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email: emailParam } },
      size: 1,
    });

    if (!searchResult.hits.hits.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = searchResult.hits.hits[0];
    const userData = user._source;

    res.json({
      email: userData.email,
      name: userData.name || '',
      id: user._id
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update username
app.patch('/users/:email', async (req, res) => {
  const emailParam = req.params.email;
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required and must be a string' });
  }

  try {
    const searchResult = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email: emailParam } },
      size: 1,
    });

    if (!searchResult.hits.hits.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = searchResult.hits.hits[0]._id;

    await esClient.update({
      index: AUTH_INDEX,
      id: userId,
      doc: { name: name.trim() },
    });

    await esClient.indices.refresh({ index: AUTH_INDEX });

    // Return updated user data
    const updatedUser = await esClient.get({
      index: AUTH_INDEX,
      id: userId,
    });

    res.json({
      success: true,
      message: 'Username updated',
      user: {
        email: updatedUser._source.email,
        name: updatedUser._source.name || '',
        id: userId
      }
    });
  } catch (err) {
    console.error('Error updating username:', err);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

// Change password
app.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Email, currentPassword, and newPassword are required' });
  }

  try {
    const result = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email } },
      size: 1,
    });

    if (!result.hits.hits.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = result.hits.hits[0];
    const userId = userDoc._id;
    const userData = userDoc._source;

    if (userData.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await esClient.update({
      index: AUTH_INDEX,
      id: userId,
      doc: { password: newPassword },
    });

    await esClient.indices.refresh({ index: AUTH_INDEX });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ===== Search History Endpoints =====

// Save search query
app.post('/search-history', async (req, res) => {
  const { userId, query, resultsCount } = req.body;

  if (!userId || !query) {
    return res.status(400).json({ error: 'userId and query are required' });
  }

  try {
    await ensureSearchHistoryIndexExists();

    // Check if the same query already exists for this user (to avoid duplicates)
    const existingSearch = await esClient.search({
      index: SEARCH_HISTORY_INDEX,
      query: {
        bool: {
          must: [
            { term: { userId } },
            { match: { query } }
          ]
        }
      },
      size: 1
    });

    // If exact query exists, update timestamp instead of creating duplicate
    if (existingSearch.hits.total.value > 0) {
      const existingId = existingSearch.hits.hits[0]._id;
      await esClient.update({
        index: SEARCH_HISTORY_INDEX,
        id: existingId,
        doc: {
          timestamp: new Date(),
          resultsCount: resultsCount || 0
        },
      });
    } else {
      await esClient.index({
        index: SEARCH_HISTORY_INDEX,
        document: {
          userId,
          query: query.trim(),
          timestamp: new Date(),
          resultsCount: resultsCount || 0
        },
      });
    }

    await esClient.indices.refresh({ index: SEARCH_HISTORY_INDEX });
    res.json({ success: true, message: 'Search query saved' });
  } catch (err) {
    console.error('Error saving search history:', err);
    res.status(500).json({ error: 'Failed to save search history' });
  }
});

// Get user search history
app.get('/search-history/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await ensureSearchHistoryIndexExists();

    const result = await esClient.search({
      index: SEARCH_HISTORY_INDEX,
      query: { term: { userId } },
      sort: [{ timestamp: { order: 'desc' } }],
      size: 50 // Limit to last 50 searches
    });

    const searchHistory = result.hits.hits.map(hit => ({
      id: hit._id,
      query: hit._source.query,
      timestamp: hit._source.timestamp,
      resultsCount: hit._source.resultsCount || 0
    }));

    res.json(searchHistory);
  } catch (err) {
    console.error('Error fetching search history:', err);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Delete search history item
app.delete('/search-history/:id', async (req, res) => {
  const historyId = req.params.id;

  try {
    await esClient.delete({
      index: SEARCH_HISTORY_INDEX,
      id: historyId
    });

    res.json({ success: true, message: 'Search history item deleted' });
  } catch (err) {
    console.error('Error deleting search history item:', err);
    res.status(500).json({ error: 'Failed to delete search history item' });
  }
});

// Clear all search history for user
app.delete('/search-history/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await esClient.deleteByQuery({
      index: SEARCH_HISTORY_INDEX,
      query: { term: { userId } }
    });

    res.json({ success: true, message: 'All search history cleared' });
  } catch (err) {
    console.error('Error clearing search history:', err);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});

// ===== Original user CRUD & search routes remain unchanged =====

// Create user
app.post('/users', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  try {
    const result = await esClient.index({
      index: INDEX,
      document: { email, password }
    });

    await esClient.indices.refresh({ index: INDEX });
    res.json({ success: true, id: result._id });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const result = await esClient.search({
      index: INDEX,
      query: { match_all: {} },
      size: 1000
    });

    const users = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  try {
    await esClient.update({
      index: INDEX,
      id: req.params.id,
      doc: { email, password }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  try {
    await esClient.delete({
      index: INDEX,
      id: req.params.id
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Search users
app.get('/users/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing search query (q)' });

  try {
    const result = await esClient.search({
      index: INDEX,
      query: {
        match: { email: query }
      }
    });

    const users = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});