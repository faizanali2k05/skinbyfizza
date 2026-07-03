'use strict';

const { Pool } = require('pg');
const config = require('./config');

/**
 * Shared Postgres connection pool. All routes import { query } and run
 * parameterised SQL ($1, $2, …) — never string-concatenate user input.
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // Background client errors shouldn't crash the process.
  console.error('[db] idle client error:', err.message);
});

/** Run a query and return the pg result. */
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
