import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Enable JSON parsing and CORS so Codespaces can call it
app.use(express.json());
app.use(cors());

// Your ngrok-exposed local API
const API_URL = process.env.API_URL || "http://localhost:5000/api/query";

// Endpoint for testing SQL queries
app.post("/test-query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "SQL query is required" });
    }

    // Forward query to your local SQL API via ngrok
    const apiRes = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    // Get API response
    const data = await apiRes.json();
    res.json(data);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run this Express server on a safe port (4000 to avoid API conflict)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`🔗 Forwarding to ${API_URL}`);
  console.log(`📩 Send POST requests to http://localhost:${PORT}/test-query`);
});
