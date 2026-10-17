/**
 * MySQL Connection Pool Configuration
 * Uses mysql2/promise for async/await parameterized SQL queries.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const baseConfig = {
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+00:00',
  dateStrings: true
};

const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
let pool;

if (connectionUrl) {
  const options = { ...baseConfig };
  if (process.env.DB_SSL === 'true' || connectionUrl.includes('ssl=') || process.env.NODE_ENV === 'production') {
    options.ssl = { rejectUnauthorized: false };
  }
  pool = mysql.createPool(connectionUrl.includes('?') ? connectionUrl : `${connectionUrl}?ssl={"rejectUnauthorized":false}`);
} else {
  const options = {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'va_trackos'
  };
  if (process.env.DB_SSL === 'true') {
    options.ssl = { rejectUnauthorized: false };
  }
  pool = mysql.createPool(options);
}

/**
 * Execute parameterized query safely
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Array>}
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Execute operations within an atomic transaction
 * Automatically rolls back on error and releases connection
 * @param {Function} callback (connection) => Promise<any>
 * @returns {Promise<any>}
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Verify database connectivity on startup
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL (${process.env.DB_NAME || 'va_trackos'}) on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database Error] Failed to connect to MySQL database:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
