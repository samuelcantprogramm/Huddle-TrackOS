require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const http = require('http');
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('⚡ Initializing Huddle TrackOS API Server...');

    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to establish database connection. Please ensure MySQL is running.');
      process.exit(1);
    }

    // Auto-initialize tables & default seed data if not already present
    try {
      const { initDb } = require('../scripts/init-db');
      await initDb();
    } catch (dbInitErr) {
      console.warn('⚠️ Note: Database auto-initialization check skipped or non-fatal:', dbInitErr.message);
    }

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Huddle TrackOS Server running on port ${PORT}`);
      console.log(`📡 API Base:        http://localhost:${PORT}/api/v1`);
      console.log(`🌐 Web UI:          http://localhost:${PORT}`);
      console.log(`📁 Uploads:         http://localhost:${PORT}/uploads`);
      console.log(`🩺 Health:          http://localhost:${PORT}/health`);
      console.log(`🗄️ Database:        ${process.env.DB_NAME || 'va_trackos'} on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
      console.log(`🔒 Environment:     ${process.env.NODE_ENV || 'development'}`);
      console.log('====================================================');
    });

    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down Huddle TrackOS server...');
      server.close(async () => {
        console.log('🔌 HTTP server closed.');
        try {
          await db.pool.end();
          console.log('🗄️ Database pool drained.');
        } catch (err) {
          console.error('Error during database pool shutdown:', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Unhandled error during server startup:', error);
    process.exit(1);
  }
}

startServer();
