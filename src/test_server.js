// test-server.js
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const API_URL = process.env.API_URL || 'http://localhost:5000/api/query';

app.post('/test-query', async (req, res) => {
  try {
    const { query } = req.body;
    const apiRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => {
  console.log('Test server running on http://localhost:5000');
  console.log('POST SQL queries to /test-query');
});