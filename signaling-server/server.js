/**
 * Nexus P2P Signaling Server
 *
 * A minimal WebSocket relay. It routes ENCRYPTED payloads between peers.
 * The server NEVER decrypts any content. It only sees:
 *   - From/to peer IDs (routing metadata)
 *   - Opaque encrypted ciphertext blobs
 *
 * Even if this server is compromised, all message content remains private
 * because it is encrypted with the recipient's public key before it leaves
 * the sender's device.
 *
 * Deploy this to any Node.js host (Railway, Fly.io, Render, etc.)
 * and set SIGNALING_URL in the app to point to it.
 */
'use strict';

const WebSocket = require('ws');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 8080;
const MAX_QUEUE_PER_PEER = 200;
const QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB (for encrypted media)

const wss = new WebSocket.Server({ port: PORT, maxPayload: MAX_PAYLOAD_BYTES });

/** Active connections: peerId -> WebSocket */
const peers = new Map();

/** Offline queue: peerId -> Array<{ id, from, message, timestamp }> */
const offlineQueue = new Map();

function queueForOffline(toPeerId, fromPeerId, message) {
  if (!offlineQueue.has(toPeerId)) offlineQueue.set(toPeerId, []);
  const queue = offlineQueue.get(toPeerId);

  // Trim expired entries
  const now = Date.now();
  const fresh = queue.filter(m => now - m.timestamp < QUEUE_TTL_MS);

  if (fresh.length >= MAX_QUEUE_PER_PEER) {
    fresh.shift(); // drop oldest when full
  }

  fresh.push({ id: message.id ?? randomUUID(), from: fromPeerId, message, timestamp: now });
  offlineQueue.set(toPeerId, fresh);
}

function deliverQueued(peerId, ws) {
  const queue = offlineQueue.get(peerId);
  if (!queue || queue.length === 0) return;

  const now = Date.now();
  const fresh = queue.filter(m => now - m.timestamp < QUEUE_TTL_MS);
  const failed = [];

  for (const item of fresh) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'MESSAGE', from: item.from, message: item.message }));
      } else {
        failed.push(item);
      }
    } catch {
      failed.push(item);
    }
  }

  if (failed.length === 0) {
    offlineQueue.delete(peerId);
  } else {
    offlineQueue.set(peerId, failed);
  }
}

function safeSend(ws, data) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  } catch { /* ignore */ }
}

wss.on('connection', (ws, req) => {
  let myPeerId = null;
  const remoteAddr = req.socket.remoteAddress;

  ws.on('message', (raw) => {
    // Size guard
    if (raw.length > MAX_PAYLOAD_BYTES) {
      safeSend(ws, { type: 'ERROR', message: 'Payload too large' });
      return;
    }

    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      safeSend(ws, { type: 'ERROR', message: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {
      case 'REGISTER': {
        if (!msg.peerId || typeof msg.peerId !== 'string' || msg.peerId.length > 64) {
          safeSend(ws, { type: 'ERROR', message: 'Invalid peerId' });
          return;
        }
        // Kick existing connection with same peerId (new device login)
        if (peers.has(msg.peerId)) {
          const old = peers.get(msg.peerId);
          safeSend(old, { type: 'ERROR', message: 'Replaced by new connection' });
          old.close();
        }
        myPeerId = msg.peerId;
        peers.set(myPeerId, ws);
        safeSend(ws, { type: 'REGISTERED', peerId: myPeerId });
        deliverQueued(myPeerId, ws);
        console.log(`[+] ${myPeerId} (${remoteAddr}) — total peers: ${peers.size}`);
        break;
      }

      case 'SEND': {
        if (!myPeerId) {
          safeSend(ws, { type: 'ERROR', message: 'Not registered' });
          return;
        }
        const { to, message } = msg;
        if (!to || !message) {
          safeSend(ws, { type: 'ERROR', message: 'Missing to or message' });
          return;
        }
        // Prevent spoofing: sender can only send as themselves
        const msgId = message.id ?? randomUUID();
        const recipientWs = peers.get(to);
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          safeSend(recipientWs, { type: 'MESSAGE', from: myPeerId, message });
          safeSend(ws, { type: 'DELIVERED', messageId: msgId });
        } else {
          queueForOffline(to, myPeerId, message);
          safeSend(ws, { type: 'QUEUED', messageId: msgId });
        }
        break;
      }

      case 'PING':
        safeSend(ws, { type: 'PONG' });
        break;

      default:
        safeSend(ws, { type: 'ERROR', message: `Unknown type: ${msg.type}` });
    }
  });

  ws.on('close', () => {
    if (myPeerId && peers.get(myPeerId) === ws) {
      peers.delete(myPeerId);
      console.log(`[-] ${myPeerId} — total peers: ${peers.size}`);
    }
  });

  ws.on('error', (err) => {
    console.error(`[!] WebSocket error (${myPeerId}):`, err.message);
  });
});

wss.on('error', (err) => {
  console.error('[!] Server error:', err.message);
});

console.log(`Nexus P2P Signaling Server running on port ${PORT}`);
console.log('Messages are end-to-end encrypted — this server never sees plaintext.');
