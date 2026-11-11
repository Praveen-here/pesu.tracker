const session = require('express-session');
const connectRedis = require('connect-redis');
const { createClient } = require('redis');
const { PesuSessionExpiredError } = require('../services/pesuService');

async function buildSessionMiddleware() {
  let store;

  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: { tls: true, rejectUnauthorized: false },
      pingInterval: 1000 * 60 * 3, // Ping every 3 minutes to keep Upstash connection alive
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    await redisClient.connect();
    console.log('[Redis] Connected to Upstash successfully.');

    // connect-redis v7 default export
    const RedisStore = connectRedis.default || connectRedis;
    store = new RedisStore({ client: redisClient, prefix: 'pesu:sess:' });
  } catch (err) {
    console.warn('[Redis] Failed to connect — falling back to in-memory sessions.');
    console.warn('[Redis] Error:', err.message);
    store = undefined; // express-session defaults to MemoryStore
  }

  return session({
    store,
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}

/**
 * If `err` means the stored PESU login has expired, sign the user out of this app
 * (there is no stored password to log in again with) and reply 401 SESSION_EXPIRED so
 * the frontend sends them to the login page. Returns true when it handled the response.
 */
function handlePesuSessionExpired(err, req, res) {
  if (!(err instanceof PesuSessionExpiredError)) return false;
  console.warn(`[Session] PESU session expired for ${req.session?.srn || 'unknown'} — signing out.`);
  const reply = () => {
    res.clearCookie('connect.sid');
    res.status(401).json({ error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' });
  };
  if (req.session) req.session.destroy(reply);
  else reply();
  return true;
}

module.exports = { buildSessionMiddleware, handlePesuSessionExpired };
