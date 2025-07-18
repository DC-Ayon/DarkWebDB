const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
require('dotenv').config(); 

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());


const esClient = new Client({
  node: 'https://localhost:9200', 
  auth: {
    username: process.env.ES_USER || 'elastic',
    password: process.env.ES_PASS || 'f1KxdjdqCZ7jEfjiMpFg'
  },
  tls: {
    rejectUnauthorized: false 
  }
});

const INDEX = 'users';

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
