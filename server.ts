import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Global CORS & healthcheck for remote clients (Vercel, Railway, etc.)
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

interface PlayerInfo {
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

interface Room {
  id: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'gameover';
  createdAt: number;
  players: Map<string, { ws: WebSocket; info: PlayerInfo }>;
}

const rooms = new Map<string, Room>();

// Helper to broadcast to all clients in a room
function broadcastToRoom(room: Room, data: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [, p] of room.players) {
    if (p.ws !== excludeWs && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload);
    }
  }
}

// Generate human-friendly 4-character room codes
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let playerId: string = Math.random().toString(36).substring(2, 9);

  ws.on('message', (message: string) => {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.type) {
        // --- 1. Create Room ---
        case 'create_room': {
          let code = generateRoomCode();
          while (rooms.has(code)) {
            code = generateRoomCode();
          }

          const room: Room = {
            id: code,
            hostId: playerId,
            status: 'lobby',
            createdAt: Date.now(),
            players: new Map()
          };

          const playerInfo: PlayerInfo = {
            id: playerId,
            name: msg.name?.trim() || `Soldado-${playerId.slice(0, 4).toUpperCase()}`,
            isHost: true,
            isReady: true,
            x: 500,
            y: 1300,
            angle: 0,
            health: 100,
            maxHealth: 100,
            isDowned: false,
            currentWeaponName: 'M1911',
            isPackAPunched: false,
            isKnifing: false,
            score: 500,
            kills: 0
          };

          room.players.set(playerId, { ws, info: playerInfo });
          rooms.set(code, room);
          currentRoomId = code;

          ws.send(JSON.stringify({
            type: 'room_created',
            roomId: code,
            playerId,
            players: [playerInfo]
          }));
          break;
        }

        // --- 2. Join Room ---
        case 'join_room': {
          const targetCode = (msg.roomId || '').toUpperCase().trim();
          const room = rooms.get(targetCode);

          if (!room) {
            ws.send(JSON.stringify({
              type: 'error',
              message: `La sala [${targetCode}] no existe o ha expirado.`
            }));
            return;
          }

          if (room.players.size >= 4) {
            ws.send(JSON.stringify({
              type: 'error',
              message: `El escuadrón [${targetCode}] ya está lleno (máximo 4 soldados).`
            }));
            return;
          }

          if (room.status === 'playing') {
            ws.send(JSON.stringify({
              type: 'error',
              message: `La partida en [${targetCode}] ya ha comenzado.`
            }));
            return;
          }

          const playerInfo: PlayerInfo = {
            id: playerId,
            name: msg.name?.trim() || `Soldado-${playerId.slice(0, 4).toUpperCase()}`,
            isHost: false,
            isReady: false,
            x: 500 + room.players.size * 30,
            y: 1300 + room.players.size * 20,
            angle: 0,
            health: 100,
            maxHealth: 100,
            isDowned: false,
            currentWeaponName: 'M1911',
            isPackAPunched: false,
            isKnifing: false,
            score: 500,
            kills: 0
          };

          room.players.set(playerId, { ws, info: playerInfo });
          currentRoomId = targetCode;

          const playerList = Array.from(room.players.values()).map(p => p.info);

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId: targetCode,
            playerId,
            players: playerList
          }));

          // Notify other squad members
          broadcastToRoom(room, {
            type: 'player_joined',
            player: playerInfo,
            players: playerList
          }, ws);
          break;
        }

        // --- 3. Toggle Ready ---
        case 'toggle_ready': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const p = room.players.get(playerId);
          if (p) {
            p.info.isReady = !p.info.isReady;
            broadcastToRoom(room, {
              type: 'player_ready_changed',
              playerId,
              isReady: p.info.isReady,
              players: Array.from(room.players.values()).map(x => x.info)
            });
          }
          break;
        }

        // --- 4. Start Game (Host only) ---
        case 'start_game': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room || room.hostId !== playerId) return;

          room.status = 'playing';
          broadcastToRoom(room, {
            type: 'game_started',
            players: Array.from(room.players.values()).map(x => x.info)
          });
          break;
        }

        // --- 5. In-Game State Sync (Position, health, shooting, points) ---
        case 'sync_player': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const p = room.players.get(playerId);
          if (p) {
            Object.assign(p.info, msg.playerState);
            broadcastToRoom(room, {
              type: 'peer_updated',
              playerId,
              playerState: msg.playerState
            }, ws);
          }
          break;
        }

        // --- 6. Bullet Fired Event ---
        case 'bullet_fired': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          broadcastToRoom(room, {
            type: 'peer_bullet',
            playerId,
            bullet: msg.bullet
          }, ws);
          break;
        }

        // --- 7. Shared World Interaction Event (Doors, Power, Box, Trap) ---
        case 'world_action': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          broadcastToRoom(room, {
            type: 'world_event',
            action: msg.action,
            data: msg.data
          }, ws);
          break;
        }

        // --- 8. Revive Downed Teammate ---
        case 'revive_action': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          broadcastToRoom(room, {
            type: 'player_revived',
            revivedPlayerId: msg.targetPlayerId,
            reviverPlayerId: playerId
          });
          break;
        }

        // --- 9. Tactical Ping / Radio Callout ---
        case 'radio_ping': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          broadcastToRoom(room, {
            type: 'radio_ping',
            playerId,
            message: msg.text
          });
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players.delete(playerId);
        if (room.players.size === 0) {
          rooms.delete(currentRoomId);
        } else {
          // If host left, reassign host
          if (room.hostId === playerId) {
            const nextHost = room.players.keys().next().value;
            if (nextHost) {
              room.hostId = nextHost;
              const p = room.players.get(nextHost);
              if (p) p.info.isHost = true;
            }
          }
          broadcastToRoom(room, {
            type: 'player_left',
            playerId,
            players: Array.from(room.players.values()).map(x => x.info)
          });
        }
      }
    }
  });
});

// Configure Vite or Static File Serving
async function setupApp() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`[Bunker 115 Server] Running on http://localhost:${PORT} with WebSocket support`);
  });
}

setupApp();
