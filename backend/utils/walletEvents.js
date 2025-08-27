const jwt = require('jsonwebtoken');

// Map of userId -> Set of response objects
const userStreams = new Map();

function addClient(userId, res) {
  if (!userStreams.has(userId)) userStreams.set(userId, new Set());
  userStreams.get(userId).add(res);
}

function removeClient(userId, res) {
  const set = userStreams.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) userStreams.delete(userId);
}

function notifyWalletUpdate(userId, balancePaisa) {
  const set = userStreams.get(String(userId));
  if (!set) return;
  const payload = `event: wallet:update\ndata: ${JSON.stringify({ balancePaisa })}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch (_) {}
  }
}

function walletStreamHandler(req, res) {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).end();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = String(decoded.id);

    // Set CORS headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });
    
    // Send initial connection message
    res.write(`event: connected\ndata: ${JSON.stringify({ userId, timestamp: Date.now() })}\n\n`);
    
    addClient(userId, res);

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
      } catch (e) {
        clearInterval(pingInterval);
        removeClient(userId, res);
      }
    }, 30000); // Ping every 30 seconds

    req.on('close', () => {
      clearInterval(pingInterval);
      removeClient(userId, res);
    });
    
    req.on('error', () => {
      clearInterval(pingInterval);
      removeClient(userId, res);
    });
  } catch (e) {
    console.error('SSE connection error:', e);
    res.status(401).end();
  }
}

module.exports = { walletStreamHandler, notifyWalletUpdate };


