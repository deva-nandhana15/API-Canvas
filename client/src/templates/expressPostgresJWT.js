// ============================================================
// expressPostgresJWT.js — Express + PostgreSQL + JWT Template
// ============================================================
// Generates a production-ready Express.js route handler with
// PostgreSQL (pg Pool) integration and optional JWT auth
// middleware. Used by the Code Generator page.
// ============================================================

export function generateExpressPostgresJWT({
  method,
  path,
  bodyFields,
  authRequired,
}) {
  // Parse comma-separated body fields into an array
  const fields = bodyFields
    ? bodyFields
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  // Destructure statement for request body
  const destructure =
    fields.length > 0 ? `const { ${fields.join(", ")} } = req.body;` : "";

  // Auth middleware placeholder for route handler
  const authMiddleware = authRequired ? "authenticateToken, " : "";

  const methodLower = method.toLowerCase();

  return `const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
${
  authRequired
    ? `
// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']
    ?.split(' ')[1];
  if (!token) return res.status(401)
    .json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(
      token, process.env.JWT_SECRET
    );
    req.user = verified;
    next();
  } catch (err) {
    res.status(403)
      .json({ error: 'Invalid token' });
  }
};
`
    : ""
}
// ${method} ${path}
router.${methodLower}('${path}', ${authMiddleware}async (req, res) => {
  try {
    ${destructure}

    // TODO: Add your PostgreSQL query here
    // Example: const result = await pool.query(
    //   'SELECT * FROM users WHERE id = $1',
    //   [req.user?.id]
    // );

    res.status(${method === "POST" ? "201" : "200"})
      .json({ 
        success: true,
        message: '${method} ${path} successful'
      });

  } catch (err) {
    console.error(err);
    res.status(500)
      .json({ error: 'Server error' });
  }
});

module.exports = router;`;
}
