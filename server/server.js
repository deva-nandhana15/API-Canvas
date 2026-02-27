// ============================================================
// server.js — ApiCanvas Express Proxy Server
// ============================================================
// This server acts as a proxy between the React frontend and
// external APIs. It exists to:
//   1. Bypass CORS restrictions (browser → this server → API)
//   2. Log every request/response to a Firestore `request_logs` collection
//
// Single endpoint:  POST /api/proxy
// ============================================================

// --------------------------------------------------
// 1. Load environment variables (must be first)
// --------------------------------------------------
require("dotenv").config();

// --------------------------------------------------
// 2. Import dependencies
// --------------------------------------------------
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { body, validationResult } = require("express-validator");
const db = require("./firebaseAdmin");

// --------------------------------------------------
// 3. Initialize Express app
// --------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// --------------------------------------------------
// 4. Middleware
// --------------------------------------------------

// Enable CORS — only allow requests from the React dev server
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "10mb" }));

// --------------------------------------------------
// 5. Health-check route (useful for debugging)
// --------------------------------------------------
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "ApiCanvas proxy server is running" });
});

// --------------------------------------------------
// 6. POST /api/proxy — Main proxy endpoint
// --------------------------------------------------
// Validation rules: method and url are required
const proxyValidation = [
  body("method")
    .trim()
    .notEmpty()
    .withMessage("method is required")
    .isIn(["GET", "POST", "PUT", "DELETE", "PATCH"])
    .withMessage("method must be one of: GET, POST, PUT, DELETE, PATCH"),
  body("url")
    .trim()
    .notEmpty()
    .withMessage("url is required")
    .isURL({ require_tld: false })
    .withMessage("url must be a valid URL"),
];

app.post("/api/proxy", proxyValidation, async (req, res, next) => {
  // --- 6a. Check validation results ---
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // --- 6b. Destructure the request body from the frontend ---
  const { method, url, headers = {}, body: reqBody, params, user_id } = req.body;

  // Log the incoming proxy request for dev debugging
  console.log(`[PROXY] ${method} → ${url}`);

  try {
    // --- 6c. Record start time for response-time measurement ---
    const startTime = Date.now();

    // --- 6d. Forward the request to the external API via Axios ---
    const axiosConfig = {
      method: method.toLowerCase(),
      url,
      headers,                       // Forward custom headers as-is
      params,                        // Append query parameters to the URL
      data: reqBody,                 // Attach request body (ignored for GET)
      timeout: 30000,                // 30-second timeout
      validateStatus: () => true,    // Do NOT throw on 4xx / 5xx responses
      // Return raw data — avoid Axios auto-parsing issues
      transformResponse: [(data) => data],
    };

    const axiosResponse = await axios(axiosConfig);

    // --- 6e. Calculate response metrics ---
    const responseTime = Date.now() - startTime;

    // Parse the raw response data
    let responseData;
    try {
      responseData = JSON.parse(axiosResponse.data);
    } catch {
      // If it's not JSON, keep it as a raw string
      responseData = axiosResponse.data;
    }

    // Calculate response size in bytes from the raw response
    const responseSize = Buffer.byteLength(
      typeof axiosResponse.data === "string"
        ? axiosResponse.data
        : JSON.stringify(axiosResponse.data),
      "utf-8"
    );

    // --- 6f. Build the response object to send back to the frontend ---
    const proxyResponse = {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers,
      data: responseData,
      responseTime,
      responseSize,
    };

    // --- 6g. Log to Firestore asynchronously (fire-and-forget) ---
    // This does NOT block or delay the response to the frontend.
    if (db) {
      db.collection("request_logs")
        .add({
          user_id: user_id || null,
          method: method.toUpperCase(),
          url,
          status_code: axiosResponse.status,
          response_time_ms: responseTime,
          response_size_bytes: responseSize,
          response_body: typeof responseData === "object" ? responseData : { raw: responseData },
          request_body: reqBody || null,
          timestamp: new Date(),
        })
        .then(() => {
          console.log("[FIRESTORE] Request logged successfully");
        })
        .catch((err) => {
          console.error("[FIRESTORE LOG ERROR]", err.message);
        });
    }

    // --- 6h. Send the proxy response back to the frontend ---
    return res.status(200).json(proxyResponse);
  } catch (error) {
    // --- 6i. Handle network errors (target API unreachable, timeout, etc.) ---
    if (error.code === "ECONNABORTED") {
      // Axios timeout
      console.error(`[PROXY TIMEOUT] ${method} ${url} — Request timed out after 30s`);
      return res.status(504).json({
        error: "Gateway Timeout",
        message: "The external API did not respond within 30 seconds.",
      });
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      // DNS resolution failed or connection refused
      console.error(`[PROXY NETWORK ERROR] ${method} ${url} — ${error.message}`);
      return res.status(502).json({
        error: "Bad Gateway",
        message: `Unable to reach the external API: ${error.message}`,
      });
    }

    // For any other unexpected errors, pass to the global error handler
    console.error(`[PROXY ERROR] ${method} ${url} — ${error.message}`);
    return next(error);
  }
});

// --------------------------------------------------
// 7. Global error-handling middleware
// --------------------------------------------------
// Express recognises this as an error handler because it has 4 parameters.
app.use((err, _req, res, _next) => {
  console.error("[SERVER ERROR]", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong on the proxy server.",
  });
});

// --------------------------------------------------
// 8. Start the server
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ ApiCanvas proxy server is running on http://localhost:${PORT}`);
});
