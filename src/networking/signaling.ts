/**
 * P2P Signaling Client
 *
 * Connects to a minimal WebSocket relay server that:
 *  - Routes encrypted message payloads between peers
 *  - Queues messages for offline peers (server cannot decrypt them)
 *  - Stores NO plaintext data — it only ever sees encrypted ciphertext
 *
 * Think of it like a postal service: it routes sealed envelopes but
 * never opens them. Even if the server is compromised, your messages
 * are safe because they're encrypted with the recipient's public key.
 */

import { encryptMessage, EncryptedPayload } from '../crypto/encryption';
import { Identity } from '../crypto/keys';
import { decodeBase64 } from 'tweetnacl-util';

// Default dev server — override with your deployed URL in production
export const DEFAULT_SIGNALING_URL = 'ws://localhost:8080';

export type IncomingHandler = (from: string, payload: EncryptedPayload, msgId: string) => void;
export type StatusHandler = (status: 'connected' | 'disconnected' | 'error') => void;

interface QueuedSend {
  to: string;
  msgId: string;
  envelope: OutboundEnvelope;
  resolve: () => void;
  reject: (e: Error) => void;
}

interface OutboundEnvelope {
  id: string;
  type: 'chat' | 'post' | 'post_like' | 'post_comment' | 'contact_update';
  payload: EncryptedPayload;
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private identity: Identity | null = null;
  private serverUrl: string;
  private onMessage: IncomingHandler | null = null;
  private onStatus: StatusHandler | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private sendQueue: QueuedSend[] = [];
  private pendingAcks = new Map<string, { resolve: () => void; reject: (e: Error) => void }>();
  private intentionalClose = false;

  constructor(serverUrl = DEFAULT_SIGNALING_URL) {
    this.serverUrl = serverUrl;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Connect and register this peer with the signaling server. */
  connect(identity: Identity, onMessage: IncomingHandler, onStatus: StatusHandler): void {
    this.identity = identity;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.intentionalClose = false;
    this._open();
  }

  private _open(): void {
    if (!this.identity) return;
    try {
      this.ws = new WebSocket(this.serverUrl);
    } catch {
      this.onStatus?.('error');
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      // Register our peerId with the server
      this._send({ type: 'REGISTER', peerId: this.identity!.peerId });
    };

    this.ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }
      this._handleServerMessage(msg);
    };

    this.ws.onerror = () => {
      this.onStatus?.('error');
    };

    this.ws.onclose = () => {
      this._cleanup();
      this.onStatus?.('disconnected');
      if (!this.intentionalClose) {
        this._scheduleReconnect();
      }
    };
  }

  private _handleServerMessage(msg: Record<string, unknown>): void {
    switch (msg.type) {
      case 'REGISTERED': {
        this.onStatus?.('connected');
        this._startPing();
        // Flush queued sends
        this._flushQueue();
        break;
      }

      case 'MESSAGE': {
        const from = msg.from as string;
        const envelope = msg.message as OutboundEnvelope;
        if (from && envelope?.payload) {
          this.onMessage?.(from, envelope.payload, envelope.id);
        }
        break;
      }

      case 'DELIVERED': {
        const ack = this.pendingAcks.get(msg.messageId as string);
        if (ack) {
          ack.resolve();
          this.pendingAcks.delete(msg.messageId as string);
        }
        break;
      }

      case 'QUEUED': {
        // Recipient offline — message queued on server; resolve locally
        const ack = this.pendingAcks.get(msg.messageId as string);
        if (ack) {
          ack.resolve();
          this.pendingAcks.delete(msg.messageId as string);
        }
        break;
      }

      case 'PONG':
        break;

      case 'ERROR':
        console.warn('[Signaling] Server error:', msg.message);
        break;
    }
  }

  /**
   * Encrypt and send a message to another peer.
   * If the peer is offline, the server queues the encrypted payload.
   */
  async sendEncrypted(
    to: string,
    recipientEncPublicKeyB64: string,
    msgId: string,
    content: object,
    type: OutboundEnvelope['type'] = 'chat',
  ): Promise<void> {
    if (!this.identity) throw new Error('Not initialized');

    const recipientKey = decodeBase64(recipientEncPublicKeyB64);
    const payload = encryptMessage(
      content,
      recipientKey,
      this.identity.encryptionKeyPair.secretKey,
      this.identity.encryptionKeyPair.publicKey,
    );

    const envelope: OutboundEnvelope = { id: msgId, type, payload };

    return new Promise((resolve, reject) => {
      const queued: QueuedSend = { to, msgId, envelope, resolve, reject };
      if (this.isConnected) {
        this._doSend(queued);
      } else {
        this.sendQueue.push(queued);
      }
    });
  }

  private _doSend(queued: QueuedSend): void {
    this.pendingAcks.set(queued.msgId, { resolve: queued.resolve, reject: queued.reject });
    this._send({ type: 'SEND', to: queued.to, message: queued.envelope });
  }

  private _flushQueue(): void {
    const items = [...this.sendQueue];
    this.sendQueue = [];
    for (const item of items) {
      this._doSend(item);
    }
  }

  private _send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private _startPing(): void {
    this.pingInterval = setInterval(() => {
      this._send({ type: 'PING' });
    }, 25_000);
  }

  private _cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this._open();
    }, 5_000);
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._cleanup();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton instance shared across the app
export const signalingClient = new SignalingClient(DEFAULT_SIGNALING_URL);
