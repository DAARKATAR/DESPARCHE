export interface RemotePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  isDowned: boolean;
  currentWeaponName: string;
  isPackAPunched: boolean;
  isKnifing: boolean;
  score: number;
  kills: number;
}

export type MultiplayerEventListener = (data: any) => void;

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public playerId: string | null = null;
  public roomId: string | null = null;
  public isHost: boolean = false;
  public isConnected: boolean = false;
  public activeServerUrl: string = '';
  public players: RemotePlayer[] = [];
  public remotePlayersMap: Map<string, RemotePlayer> = new Map();

  private listeners: Map<string, Set<MultiplayerEventListener>> = new Map();

  constructor() {
    this.setupListeners();
  }

  public static getEffectiveWsUrl(): string {
    // 1. Manual user override stored in localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bunker_ws_server');
      if (saved && saved.trim().length > 0) {
        return saved.trim();
      }
    }

    // 2. Vite environment variable (configured in Vercel or .env)
    const envUrl = (import.meta as any).env?.VITE_WS_URL;
    if (envUrl && envUrl.trim().length > 0) {
      return envUrl.trim();
    }

    // 3. Fallback when running on Vercel / Netlify / GitHub Pages (since static hosts do NOT run Node WebSockets)
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('vercel.app') ||
       window.location.hostname.includes('netlify.app') ||
       window.location.hostname.includes('github.io'))
    ) {
      return 'wss://ais-pre-t33wi5sdh6maaryr5zrf6d-263217880532.us-west2.run.app/ws';
    }

    // 4. Default same-origin connection (for localhost, Docker, Cloud Run, Render, Railway)
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    }

    return 'ws://localhost:3000/ws';
  }

  private setupListeners() {
    this.listeners.set('room_created', new Set());
    this.listeners.set('room_joined', new Set());
    this.listeners.set('player_joined', new Set());
    this.listeners.set('player_left', new Set());
    this.listeners.set('player_ready_changed', new Set());
    this.listeners.set('game_started', new Set());
    this.listeners.set('peer_updated', new Set());
    this.listeners.set('peer_bullet', new Set());
    this.listeners.set('world_event', new Set());
    this.listeners.set('player_revived', new Set());
    this.listeners.set('radio_ping', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('connected', new Set());
    this.listeners.set('disconnected', new Set());
  }

  public on(event: string, callback: MultiplayerEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  public off(event: string, callback: MultiplayerEventListener) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in listener for ${event}:`, err);
      }
    });
  }

  public connect(customUrl?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUrl = customUrl || MultiplayerClient.getEffectiveWsUrl();
      this.activeServerUrl = targetUrl;

      // If already connected to the same URL, reuse
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.isConnected = true;
        resolve();
        return;
      }

      // Close existing socket if connecting to new target
      if (this.ws) {
        try {
          this.ws.close();
        } catch (_) {}
        this.ws = null;
      }

      try {
        this.ws = new WebSocket(targetUrl);
      } catch (err) {
        this.isConnected = false;
        reject(err);
        return;
      }

      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          try {
            this.ws?.close();
          } catch (_) {}
          this.ws = null;
          reject(new Error(`Timeout de conexión con ${targetUrl}`));
        }
      }, 7000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.emit('connected', { url: targetUrl });
        resolve();
      };

      this.ws.onerror = (err) => {
        clearTimeout(connectionTimeout);
        console.error('[MultiplayerClient] WebSocket connection error:', err);
        this.isConnected = false;
        reject(err);
      };

      this.ws.onclose = () => {
        clearTimeout(connectionTimeout);
        this.isConnected = false;
        this.emit('disconnected', { url: targetUrl });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('[MultiplayerClient] Message parse error:', e);
        }
      };
    });
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'room_created':
        this.roomId = msg.roomId;
        this.playerId = msg.playerId;
        this.isHost = true;
        this.players = msg.players;
        this.updateMap();
        this.emit('room_created', msg);
        break;

      case 'room_joined':
        this.roomId = msg.roomId;
        this.playerId = msg.playerId;
        this.isHost = false;
        this.players = msg.players;
        this.updateMap();
        this.emit('room_joined', msg);
        break;

      case 'player_joined':
        this.players = msg.players;
        this.updateMap();
        this.emit('player_joined', msg);
        break;

      case 'player_left':
        this.players = msg.players;
        if (msg.playerId) {
          this.remotePlayersMap.delete(msg.playerId);
        }
        // Check if host status changed
        const me = this.players.find(p => p.id === this.playerId);
        if (me) this.isHost = me.isHost;
        this.emit('player_left', msg);
        break;

      case 'player_ready_changed':
        this.players = msg.players;
        this.updateMap();
        this.emit('player_ready_changed', msg);
        break;

      case 'game_started':
        this.emit('game_started', msg);
        break;

      case 'peer_sync':
        if (msg.playerId !== this.playerId) {
          const existing = this.remotePlayersMap.get(msg.playerId);
          if (existing) {
            Object.assign(existing, msg.playerState);
          } else {
            this.remotePlayersMap.set(msg.playerId, {
              id: msg.playerId,
              ...msg.playerState
            });
          }
          this.emit('peer_updated', msg);
        }
        break;

      case 'peer_bullet':
        if (msg.playerId !== this.playerId) {
          this.emit('peer_bullet', msg);
        }
        break;

      case 'world_event':
        this.emit('world_event', msg);
        break;

      case 'player_revived':
        this.emit('player_revived', msg);
        break;

      case 'radio_ping':
        this.emit('radio_ping', msg);
        break;

      case 'error':
        this.emit('error', msg.message);
        break;
    }
  }

  private updateMap() {
    this.remotePlayersMap.clear();
    for (const p of this.players) {
      if (p.id !== this.playerId) {
        this.remotePlayersMap.set(p.id, p);
      }
    }
  }

  public async createRoom(playerName: string) {
    await this.connect();
    this.send({
      type: 'create_room',
      name: playerName
    });
  }

  public async joinRoom(roomId: string, playerName: string) {
    await this.connect();
    this.send({
      type: 'join_room',
      roomId: roomId.toUpperCase().trim(),
      name: playerName
    });
  }

  public toggleReady() {
    this.send({ type: 'toggle_ready' });
  }

  public startGame() {
    this.send({ type: 'start_game' });
  }

  public syncPlayerState(state: Partial<RemotePlayer>) {
    this.send({
      type: 'sync_player',
      playerState: state
    });
  }

  public broadcastBullet(bullet: any) {
    this.send({
      type: 'bullet_fired',
      bullet
    });
  }

  public broadcastWorldAction(action: string, data?: any) {
    this.send({
      type: 'world_action',
      action,
      data
    });
  }

  public sendRevive(targetPlayerId: string) {
    this.send({
      type: 'revive_player',
      targetPlayerId
    });
  }

  public sendRadioPing(x: number, y: number, text?: string) {
    this.send({
      type: 'radio_ping',
      x,
      y,
      text: text || '¡Atención aquí!'
    });
  }

  private send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.roomId = null;
    this.playerId = null;
    this.players = [];
    this.remotePlayersMap.clear();
  }
}

export const multiplayerClient = new MultiplayerClient();
