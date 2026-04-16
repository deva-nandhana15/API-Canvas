// ============================================================
// server.js — ApiCanvas Express Proxy Server (Hardened)
// ============================================================
// This server acts as a secure proxy between the React frontend
// and external APIs. It exists to:
//   1. Bypass CORS restrictions (browser → this server → API)
//   2. Log every request/response to a Firestore `request_logs` collection
//   3. Enforce security best-practices (helmet, rate limiting,
//      SSRF protection, strict CORS, input validation, etc.)
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
const helmet = require("helmet");               // SECURITY: Secure HTTP headers
const rateLimit = require("express-rate-limit"); // SECURITY: Rate limiting
const axios = require("axios");
const { body, validationResult } = require("express-validator");
const db = require("./firebaseAdmin");

// --------------------------------------------------
// 3. Initialize Express app
// --------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// 4. Security: Helmet — set secure HTTP headers
// --------------------------------------------------
// Helmet sets various HTTP headers to help protect the app
// (Content-Security-Policy, X-Content-Type-Options, etc.)
app.use(helmet());

// Disable x-powered-by header explicitly
// (helmet already does this, but being explicit is clearer)
app.disable("x-powered-by");

// Trust first proxy — needed for accurate IP detection
// when running behind a reverse proxy (Nginx, Render, etc.)
app.set("trust proxy", 1);

// --------------------------------------------------
// 5. Security: Strict CORS configuration
// --------------------------------------------------
// Only allow requests from known frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// --------------------------------------------------
// 6. Security: Request size limits
// --------------------------------------------------
// Prevent excessively large payloads from being sent to the server
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// --------------------------------------------------
// 7. Security: Rate limiting
// --------------------------------------------------

// General rate limiter — applies to ALL routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 50,                  // max 50 requests per window per IP
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,     // Return rate-limit info in `RateLimit-*` headers
  legacyHeaders: false,      // Disable `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    console.warn(`[SECURITY] Rate limit hit: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

// Strict rate limiter — only for the proxy endpoint
const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 50,                  // max 50 proxy requests per window per IP
  message: {
    error: "Too many proxy requests, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`[SECURITY] Proxy rate limit hit: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

// Apply general limiter to all routes
app.use(generalLimiter);

// Apply strict limiter specifically to the proxy endpoint
app.use("/api/proxy", proxyLimiter);

// --------------------------------------------------
// 8. Validation & security helper functions
// --------------------------------------------------

// Check if a URL has a valid http/https format
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Check if a URL points to a private/internal network (SSRF protection)
// Blocks requests to localhost, private IP ranges, and cloud metadata endpoints
const isPrivateUrl = (url) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Exact hostnames that must be blocked
    const blockedPatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "metadata.google.internal",
      "169.254.169.254", // AWS / GCP metadata endpoint
      "100.100.100.200", // Alibaba Cloud metadata endpoint
    ];

    // Private IP range prefixes (RFC 1918 + link-local)
    const blockedPrefixes = [
      "192.168.",
      "10.",
      "172.16.", "172.17.", "172.18.", "172.19.",
      "172.20.", "172.21.", "172.22.", "172.23.",
      "172.24.", "172.25.", "172.26.", "172.27.",
      "172.28.", "172.29.", "172.30.", "172.31.",
    ];

    if (blockedPatterns.includes(hostname)) return true;
    if (blockedPrefixes.some((prefix) => hostname.startsWith(prefix))) return true;

    return false;
  } catch {
    return true; // Block if URL cannot be parsed
  }
};

// Whitelist of allowed HTTP methods
const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

// Remove sensitive internal headers from the proxied response
// before forwarding back to the frontend
const sanitizeHeaders = (headers) => {
  const sensitiveHeaders = [
    "x-powered-by",
    "server",
    "x-aspnet-version",
    "x-aspnetmvc-version",
    "x-generator",
    "x-drupal-cache",
    "x-varnish",
    "via",
  ];

  const sanitized = { ...headers };
  sensitiveHeaders.forEach((h) => {
    delete sanitized[h];
  });
  return sanitized;
};

// --------------------------------------------------
// 9. Health-check route (useful for debugging)
// --------------------------------------------------
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "ApiCanvas proxy server is running" });
});

// --------------------------------------------------
// 10. POST /api/proxy — Main proxy endpoint
// --------------------------------------------------
app.post("/api/proxy", async (req, res) => {
  const { method, url, headers, body: reqBody, params, user_id } = req.body;

  // --- INPUT VALIDATION ---

  // Check method exists and is allowed
  if (!method) {
    return res.status(400).json({ error: "Method is required" });
  }

  if (!ALLOWED_METHODS.includes(method.toUpperCase())) {
    return res.status(400).json({
      error: `Method must be one of: ${ALLOWED_METHODS.join(", ")}`,
    });
  }

  // Check URL exists
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Check URL format is valid (must be http:// or https://)
  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: "Invalid URL format. Must start with http:// or https://",
    });
  }

  // SSRF protection — block private/internal URLs
  if (isPrivateUrl(url)) {
    console.warn(
      `[SECURITY] Blocked private URL attempt: ${url} from user: ${user_id || "anonymous"}`
    );
    return res.status(403).json({
      error: "Requests to private or internal URLs are not allowed",
    });
  }

  // --- FORWARD REQUEST ---

  // Log the incoming proxy request for dev debugging
  console.log(`[PROXY] ${method.toUpperCase()} → ${url}`);

  const startTime = Date.now();

  try {
    const axiosResponse = await axios({
      method: method.toUpperCase(),
      url,
      headers: headers || {},
      data: reqBody || undefined,
      params: params || {},
      timeout: 30000,              // 30-second timeout
      validateStatus: () => true,  // Don't throw on 4xx/5xx responses
      // Return raw data — avoid Axios auto-parsing issues
      transformResponse: [(data) => data],
      // Limit response size to 5 MB
      maxContentLength: 5 * 1024 * 1024,
      maxBodyLength: 5 * 1024 * 1024,
    });

    const responseTime = Date.now() - startTime;

    // Parse the raw response data
    let responseData;
    try {
      responseData = JSON.parse(axiosResponse.data);
    } catch {
      // If it's not JSON, keep it as a raw string
      responseData = axiosResponse.data;
    }

    // Calculate response size in bytes
    const responseSize = Buffer.byteLength(
      typeof axiosResponse.data === "string"
        ? axiosResponse.data
        : JSON.stringify(axiosResponse.data),
      "utf-8"
    );

    // Log to Firestore asynchronously (fire-and-forget)
    // This does NOT block or delay the response to the frontend.
    if (db && user_id) {
      db.collection("request_logs")
        .add({
          user_id,
          method: method.toUpperCase(),
          url,
          status_code: axiosResponse.status,
          response_time_ms: responseTime,
          response_size_bytes: responseSize,
          response_body:
            typeof responseData === "object" ? responseData : { raw: responseData },
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

    // Send sanitized response back to the frontend
    return res.status(200).json({
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: sanitizeHeaders(axiosResponse.headers),
      data: responseData,
      responseTime,
      responseSize,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Handle specific error types with appropriate status codes

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.error(`[PROXY TIMEOUT] ${method} ${url} — timed out after 30s`);
      return res.status(504).json({
        error: "Request timed out after 30s",
        responseTime,
      });
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error(`[PROXY NETWORK ERROR] ${method} ${url} — ${error.message}`);
      return res.status(502).json({
        error: "Unable to reach the API. Check the URL and try again.",
        responseTime,
      });
    }

    if (error.message === "Not allowed by CORS") {
      return res.status(403).json({
        error: "CORS: Origin not allowed",
        responseTime,
      });
    }

    console.error("[PROXY ERROR]", error.message);
    return res.status(500).json({
      error: "Internal proxy error",
      responseTime,
    });
  }
});

// --------------------------------------------------
// 11. Global error-handling middleware
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
// 12. Start the server
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ ApiCanvas proxy server is running on http://localhost:${PORT}`);
});
