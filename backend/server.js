const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { Client } = require('@elastic/elasticsearch');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Enhanced error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON format',
      details: 'Request body contains malformed JSON'
    });
  }
  next(err);
});

// Elasticsearch Client
const esClient = new Client({
  node: process.env.ES_NODE || 'https://127.0.0.1:9200',
  auth: {
    username: process.env.ES_USER || 'elastic',
    password: process.env.ES_PASS || 'Pass@123',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test Elasticsearch connection
const testElasticsearchConnection = async () => {
  try {
    const health = await esClient.cluster.health();
    console.log('✅ Elasticsearch connection established:', health.cluster_name);
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error.message);
    console.error('Server will continue but Elasticsearch features may not work');
  }
};

// Elasticsearch Indexes
const INDEX = 'users';
const AUTH_INDEX = 'auth_users';
const SEARCH_HISTORY_INDEX = 'search_history';

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/deepcytes";

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB (deepcytes DB)");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Server will continue but file upload features may not work");
  }
};

// MongoDB File Schema
const fileSchema = new mongoose.Schema({
  originalName: String,
  mimeType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema, "rawdata");

// File Upload Setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/csv",
      "application/json",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Only CSV, JSON, and Excel files are allowed!");
      error.code = 'INVALID_FILE_TYPE';
      return cb(error);
    }

    cb(null, true);
  },
});

// Multer error handling
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          details: `Maximum file size is ${(parseInt(process.env.MAX_FILE_SIZE) || 5242880) / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          details: 'Only one file can be uploaded at a time'
        });
      default:
        return res.status(400).json({
          error: 'File upload error',
          details: err.message
        });
    }
  }

  if (err && err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Invalid file type',
      details: err.message
    });
  }

  next(err);
};

// Helper Functions
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
      console.log(`✅ Created index ${AUTH_INDEX}`);
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
    console.error(`❌ Error ensuring ${AUTH_INDEX} index exists:`, err.message);
    throw new Error(`Failed to create or verify ${AUTH_INDEX} index`);
  }
}

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
      console.log(`✅ Created index ${SEARCH_HISTORY_INDEX}`);
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
    console.error(`❌ Error ensuring ${SEARCH_HISTORY_INDEX} index exists:`, err.message);
    throw new Error(`Failed to create or verify ${SEARCH_HISTORY_INDEX} index`);
  }
}

// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// ===== Routes =====
// IMPORTANT: Order matters! Static routes first, then parameterized routes

// Health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      server: 'healthy'
    }
  };

  try {
    health.services.mongodb = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  } catch (err) {
    health.services.mongodb = 'error';
  }

  try {
    await esClient.ping();
    health.services.elasticsearch = 'healthy';
  } catch (err) {
    health.services.elasticsearch = 'unhealthy';
  }

  const servicesHealthy = Object.values(health.services).every(status => status === 'healthy');
  if (!servicesHealthy) {
    health.status = 'degraded';
    return res.status(503).json(health);
  }

  res.json(health);
});

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Email and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Invalid password',
        details: 'Password must be at least 6 characters long'
      });
    }

    await ensureAuthIndexExists();

    const existingUser = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email: email.toLowerCase() } },
    });

    if (existingUser.hits.total.value > 0) {
      return res.status(409).json({
        error: 'User already exists',
        details: 'An account with this email address already exists'
      });
    }

    const result = await esClient.index({
      index: AUTH_INDEX,
      document: {
        email: email.toLowerCase(),
        password,
        name: name && name.trim() !== '' ? name.trim() : ''
      },
    });

    await esClient.indices.refresh({ index: AUTH_INDEX });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      id: result._id
    });

  } catch (err) {
    console.error('Registration error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Registration failed',
      details: 'Unable to create user account. Please try again.'
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        details: 'Email and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    await ensureAuthIndexExists();

    const result = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email: email.toLowerCase() } },
      size: 1,
    });

    if (result.hits.total.value === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    const user = result.hits.hits[0];
    const userData = user._source;

    if (password !== userData.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    res.json({
      email: userData.email,
      name: userData.name || '',
      id: user._id,
      message: 'Login successful'
    });

  } catch (err) {
    console.error('Login error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Login failed',
      details: 'Unable to authenticate. Please try again.'
    });
  }
});

// Change password route
app.post('/api/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Email, current password, and new password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'Invalid new password',
        details: 'New password must be at least 6 characters long'
      });
    }

    const result = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email: email.toLowerCase() } },
      size: 1,
    });

    if (!result.hits.hits.length) {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with the provided email address'
      });
    }

    const userDoc = result.hits.hits[0];
    const userId = userDoc._id;
    const userData = userDoc._source;

    if (userData.password !== currentPassword) {
      return res.status(401).json({
        error: 'Current password is incorrect',
        details: 'The current password you entered does not match our records'
      });
    }

    await esClient.update({
      index: AUTH_INDEX,
      id: userId,
      doc: { password: newPassword },
    });

    await esClient.indices.refresh({ index: AUTH_INDEX });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Password change error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to change password',
      details: 'Unable to change password. Please try again.'
    });
  }
});

// Profile routes
app.get('/profile/:email', async (req, res) => {
  try {
    const emailParam = req.params.email;

    if (!validateEmail(emailParam)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    const searchResult = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email: emailParam.toLowerCase() } },
      size: 1,
    });

    if (!searchResult.hits.hits.length) {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with the provided email address'
      });
    }

    const user = searchResult.hits.hits[0];
    const userData = user._source;

    res.json({
      email: userData.email,
      name: userData.name || '',
      id: user._id
    });

  } catch (err) {
    console.error('Profile fetch error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: 'Unable to retrieve user profile. Please try again.'
    });
  }
});

// File upload routes
app.post("/upload", upload.single("file"), handleMulterError, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database unavailable',
        details: 'MongoDB connection is not available. Please try again later.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
        details: "Please select a file to upload"
      });
    }

    const newFile = new File({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    const savedFile = await newFile.save();

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: savedFile._id,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        uploadedAt: savedFile.uploadedAt
      }
    });

  } catch (err) {
    console.error("Upload error:", err.message || err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: "File validation failed",
        details: err.message
      });
    }

    res.status(500).json({
      error: "File upload failed",
      details: "Unable to save file. Please try again."
    });
  }
});

app.get("/files", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database unavailable',
        details: 'MongoDB connection is not available. Please try again later.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (limit > 100) {
      return res.status(400).json({
        error: 'Invalid limit',
        details: 'Limit cannot exceed 100 files per request'
      });
    }

    const files = await File.find()
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalFiles = await File.countDocuments();

    res.json({
      success: true,
      files,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFiles / limit),
        totalFiles,
        hasNext: skip + limit < totalFiles,
        hasPrev: page > 1
      }
    });

  } catch (err) {
    console.error("Fetch files error:", err.message || err);
    res.status(500).json({
      error: "Could not fetch files",
      details: "Unable to retrieve file list. Please try again."
    });
  }
});

// Search history routes
app.post('/api/search-history', async (req, res) => {
  try {
    const { userId, query, resultsCount } = req.body;

    if (!userId || !query) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId and query are required'
      });
    }

    await ensureSearchHistoryIndexExists();

    const existingSearch = await esClient.search({
      index: SEARCH_HISTORY_INDEX,
      query: {
        bool: {
          must: [
            { term: { userId } },
            { match: { query: query.trim() } }
          ]
        }
      },
      size: 1
    });

    if (existingSearch.hits.total.value > 0) {
      const existingId = existingSearch.hits.hits[0]._id;
      await esClient.update({
        index: SEARCH_HISTORY_INDEX,
        id: existingId,
        doc: {
          timestamp: new Date(),
          resultsCount: parseInt(resultsCount) || 0
        },
      });
    } else {
      await esClient.index({
        index: SEARCH_HISTORY_INDEX,
        document: {
          userId,
          query: query.trim(),
          timestamp: new Date(),
          resultsCount: parseInt(resultsCount) || 0
        },
      });
    }

    await esClient.indices.refresh({ index: SEARCH_HISTORY_INDEX });
    res.json({
      success: true,
      message: 'Search query saved successfully'
    });

  } catch (err) {
    console.error('Save search history error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to save search history',
      details: 'Unable to save search query. Please try again.'
    });
  }
});

app.get('/api/search-history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    await ensureSearchHistoryIndexExists();

    const result = await esClient.search({
      index: SEARCH_HISTORY_INDEX,
      query: { term: { userId } },
      sort: [{ timestamp: { order: 'desc' } }],
      size: parseInt(process.env.SEARCH_HISTORY_LIMIT) || 50
    });

    const searchHistory = result.hits.hits.map(hit => ({
      id: hit._id,
      query: hit._source.query,
      timestamp: hit._source.timestamp,
      resultsCount: hit._source.resultsCount || 0
    }));

    res.json({
      success: true,
      history: searchHistory,
      total: searchHistory.length
    });

  } catch (err) {
    console.error('Fetch search history error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to fetch search history',
      details: 'Unable to retrieve search history. Please try again.'
    });
  }
});

app.delete('/api/search-history/:id', async (req, res) => {
  try {
    const historyId = req.params.id;

    const deleteResult = await esClient.delete({
      index: SEARCH_HISTORY_INDEX,
      id: historyId
    });

    if (deleteResult.result === 'not_found') {
      return res.status(404).json({
        error: 'Search history item not found',
        details: 'The specified search history item does not exist'
      });
    }

    res.json({
      success: true,
      message: 'Search history item deleted successfully'
    });

  } catch (err) {
    console.error('Delete search history error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to delete search history item',
      details: 'Unable to delete search history item. Please try again.'
    });
  }
});

app.delete('/api/search-history/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const deleteResult = await esClient.deleteByQuery({
      index: SEARCH_HISTORY_INDEX,
      query: { term: { userId } }
    });

    res.json({
      success: true,
      message: 'All search history cleared successfully',
      deletedCount: deleteResult.deleted || 0
    });

  } catch (err) {
    console.error('Clear search history error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to clear search history',
      details: 'Unable to clear search history. Please try again.'
    });
  }
});

// Users routes - CAREFUL ORDERING: search must come before :id routes
// ONLY THESE ROUTES HAVE /api PREFIX
app.get('/api/users/search', async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        error: 'Missing search query',
        details: 'Search query (q) parameter is required'
      });
    }

    const size = parseInt(req.query.size) || 10;
    if (size > 50) {
      return res.status(400).json({
        error: 'Invalid size',
        details: 'Size cannot exceed 50 results per search'
      });
    }

    const result = await esClient.search({
      index: INDEX,
      query: {
        match: { email: query.trim() }
      },
      size
    });

    const users = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source,
      score: hit._score
    }));

    res.json({
      success: true,
      query: query.trim(),
      users,
      total: result.hits.total.value,
      maxScore: result.hits.max_score
    });

  } catch (err) {
    console.error('Search users error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Search failed',
      details: 'Unable to perform search. Please try again.'
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Email and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    const result = await esClient.index({
      index: INDEX,
      document: { email: email.toLowerCase(), password }
    });

    await esClient.indices.refresh({ index: INDEX });
    res.json({
      success: true,
      message: 'User created successfully',
      id: result._id
    });

  } catch (err) {
    console.error('Create user error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to create user',
      details: 'Unable to create user. Please try again.'
    });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const from = (page - 1) * size;

    if (size > 100) {
      return res.status(400).json({
        error: 'Invalid size',
        details: 'Size cannot exceed 100 users per request'
      });
    }

    const result = await esClient.search({
      index: INDEX,
      query: { match_all: {} },
      from,
      size
    });

    const users = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalHits: result.hits.total.value,
        returnedHits: users.length
      }
    });

  } catch (err) {
    console.error('Fetch users error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to fetch users',
      details: 'Unable to retrieve users. Please try again.'
    });
  }
});

// Update username by email (not ID to avoid conflicts)
app.patch('/api/users/:email', async (req, res) => {
  try {
    const emailParam = req.params.email;
    const { name } = req.body;

    if (!validateEmail(emailParam)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        error: 'Invalid name',
        details: 'Name is required and must be a non-empty string'
      });
    }

    const searchResult = await esClient.search({
      index: AUTH_INDEX,
      query: { term: { email: emailParam.toLowerCase() } },
      size: 1,
    });

    if (!searchResult.hits.hits.length) {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with the provided email address'
      });
    }

    const userId = searchResult.hits.hits[0]._id;

    await esClient.update({
      index: AUTH_INDEX,
      id: userId,
      doc: { name: name.trim() },
    });

    await esClient.indices.refresh({ index: AUTH_INDEX });

    const updatedUser = await esClient.get({
      index: AUTH_INDEX,
      id: userId,
    });

    res.json({
      success: true,
      message: 'Username updated successfully',
      user: {
        email: updatedUser._source.email,
        name: updatedUser._source.name || '',
        id: userId
      }
    });

  } catch (err) {
    console.error('Username update error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to update username',
      details: 'Unable to update username. Please try again.'
    });
  }
});

// Update user by ID
app.put('/api/users/:id', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.params.id;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Email and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    const updateResult = await esClient.update({
      index: INDEX,
      id: userId,
      doc: { email: email.toLowerCase(), password }
    });

    if (updateResult.result === 'noop') {
      return res.status(200).json({
        success: true,
        message: 'No changes were made (data was identical)'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (err) {
    if (err.meta?.body?.error?.type === 'document_missing_exception') {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with the provided ID'
      });
    }

    console.error('Update user error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to update user',
      details: 'Unable to update user. Please try again.'
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const deleteResult = await esClient.delete({
      index: INDEX,
      id: userId
    });

    if (deleteResult.result === 'not_found') {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with the provided ID'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (err) {
    console.error('Delete user error:', err.meta?.body || err.message || err);
    res.status(500).json({
      error: 'Failed to delete user',
      details: 'Unable to delete user. Please try again.'
    });
  }
});

// IMPORTANT: Catch-all route using different syntax for Express 5.x compatibility
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    details: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /health',
      'POST /register',
      'POST /login',
      'POST /change-password',
      'GET /profile/:email',
      'POST /search-history',
      'GET /search-history/:userId',
      'DELETE /search-history/:id',
      'DELETE /search-history/user/:userId',
      'POST /upload',
      'GET /files',
      'GET /api/users/search',
      'POST /api/users',
      'GET /api/users',
      'PATCH /api/users/:email',
      'PUT /api/users/:id',
      'DELETE /api/users/:id'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    details: isDevelopment ? err.message : 'Something went wrong. Please try again later.',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    await esClient.close();
    console.log('Elasticsearch connection closed');

    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    await esClient.close();
    console.log('Elasticsearch connection closed');

    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Initialize connections and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');

    // Test connections
    await testElasticsearchConnection();
    await connectToMongoDB();

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      console.log(`🔍 Health check available at http://localhost:${PORT}/health`);
      console.log('📋 Available routes:');
      console.log('   System:');
      console.log('     GET  /health');
      console.log('   Authentication:');
      console.log('     POST /register');
      console.log('     POST /login');
      console.log('     POST /change-password');
      console.log('   Profile:');
      console.log('     GET  /profile/:email');
      console.log('   File Management:');
      console.log('     POST /upload');
      console.log('     GET  /files');
      console.log('   Search History:');
      console.log('     POST /search-history');
      console.log('     GET  /search-history/:userId');
      console.log('     DELETE /search-history/:id');
      console.log('     DELETE /search-history/user/:userId');
      console.log('   User Management (API):');
      console.log('     GET  /api/users/search');
      console.log('     GET  /api/users');
      console.log('     POST /api/users');
      console.log('     PATCH /api/users/:email');
      console.log('     PUT  /api/users/:id');
      console.log('     DELETE /api/users/:id');
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();